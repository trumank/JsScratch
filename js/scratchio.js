// FieldStream ////////////////////////////////////////////

function FieldStream(fields) {
	this.fields = fields;
	this.index = -1;
}

FieldStream.prototype.nextField = function () {
	this.index += 1;
	return this.fields[this.index];
};


// Ref ////////////////////////////////////////////////////

function Ref(index) {
	this.index = index - 1;
}


// ObjectStream ///////////////////////////////////////////

function ObjectStream(stream) {
	this.stream = stream;

	var version = this.readFileHeader();
	if (version === -1) {
		throw 'Not a Scratch project';
	} else if (version !== 2) {
		throw 'Project is too old: ' + version;
	}

	this.endOfInfo = stream.nextUnsignedInt(4);
}

// read the file header (the version of the file)
ObjectStream.prototype.readFileHeader = function () {
	return this.stream.nextString(8) === 'ScratchV' ? parseFloat(this.stream.nextString(2)) : -1;
};

// read the next object's header
ObjectStream.prototype.readObjectHeader = function () {
	this.temp = this.stream.index;
	return this.stream.nextString(10) === 'ObjS\1Stch\1';
};

// get the next object in the stream
ObjectStream.prototype.nextObject = function () {
	if (!this.readObjectHeader()) {
		throw ('Corrupt File');
	}

	var objectSize = this.stream.nextUnsignedInt(4),
		fields = [],
		i;

	for (i = 0; i < objectSize; i += 1) {
		fields[i] = this.readField();
	}
	return this.fixReferences(fields);
};

ObjectStream.prototype.readField = function () {
	var id = this.stream.next();

	if (id === 99) {
		return new Ref(this.stream.nextUnsignedInt(3));
	} else if (id <= 8) {
		return this.readFixedFormat(id);
	} else if (id < 99) {
		return [id, this.readFixedFormat(id)];
	}

	var version = this.stream.next(),
		size = this.stream.next(),
		arr = [];

	for (var i = 0; i < size; i++) {
		arr[i] = this.readField();
	}

	return [id, arr, version, size];
};

ObjectStream.prototype.readFixedFormat = function (id) {
	switch (id) {
	case 1: //nil
		return null;
	case 2: //True
		return true;
	case 3: //False
		return false;
	case 4: //SmallInteger
		return this.stream.nextSignedInt(4);
	case 5: //SmallInteger16
		return this.stream.nextSignedInt(2);
	case 6: //LargePositiveInteger
	case 7: //LargeNegativeInteger
		var d1 = 0;
		var d2 = 1;
		var i = this.stream.nextUnsignedInt(2);
		for (var j = 0; j < i; j++) {
			var k = this.stream.next();
			d1 += d2 * k;
			d2 *= 256;
		}
		return id == 7 ? -d1 : d1;
	case 8: //Float
		var bv = new Uint8Array(8);
		for (var i = 7; i >= 0; i--) {
			bv[i] = this.stream.next();
		}
		return new Float64Array(bv.buffer)[0];
	case 9: //String
		return this.stream.nextString(this.stream.nextUnsignedInt(4));
	case 10: //Symbol
		return this.stream.nextString(this.stream.nextUnsignedInt(4));
	case 11: //ByteArray
		return this.stream.nextArray(this.stream.nextUnsignedInt(4));
	case 12: //SoundBuffer
		return this.stream.nextArray(this.stream.nextUnsignedInt(4) * 2);
	case 13: //Bitmap
		var size = this.stream.nextUnsignedInt(4);
		var arr = new Uint32Array(size);
		for (var i = 0; i < size; i++) {
			arr[i] = this.stream.nextUnsignedInt(4);
		}
		arr.isBitmap = true;
		return arr;
	case 14: //UTF8
		return this.stream.nextUtf8String(this.stream.nextUnsignedInt(4));
	case 20: //Array
	case 21: //OrderedCollection
	case 24: //Dictionary
	case 25: //IdentityDictionary
		var arr = [],
			size = (id == 24 || id == 25) ? this.stream.nextUnsignedInt(4) * 2 : this.stream.nextUnsignedInt(4),
			i;
		for (i = 0; i < size; i++) {
			arr[i] = this.readField();
		}
		return arr;
	case 30: //Color
		var color = this.stream.nextUnsignedInt(4);
		return new Color(color >> 22 & 0xFF, color >> 12 & 0xFF, color >> 2 & 0xFF);
	case 31: //TranslucentColor
		var color = this.stream.nextUnsignedInt(4);
		return new Color(color >> 22 & 0xFF, color >> 12 & 0xFF, color >> 2 & 0xFF, this.stream.next());
	case 32: //Point
		return [this.readField(), this.readField()];
	case 33: //Rectangle
		return [this.readField(), this.readField(), this.readField(), this.readField()];
	case 34: //Form
		return [this.readField(), this.readField(), this.readField(), this.readField(), this.readField()];
	case 35: //ColorForm
		return [this.readField(), this.readField(), this.readField(), this.readField(), this.readField(), this.readField()];
	}
	throw 'Unknown object: ' + id;
};

ObjectStream.prototype.fixReferences = function (objTable) {
	var newObj = [];
	for (var i = 0; i < objTable.length; i++) {
		newObj[i] = this.classForObject(objTable[i]);
	}

	for (var i = 0; i < newObj.length; i++) {
		var obj = objTable[i];
		
		var os = obj[1];
		
		for (var j = 0; j < os.length; j++) {
			os[j] = os[j] instanceof Ref ? newObj[os[j].index] : os[j]
		}
		
		switch (obj[0]) {
		case 20:
		case 21:
			for (var j = 0; j < obj[1].length; j++)
				newObj[i].push(os[j]);
			break;
		case 24:
		case 25:
			for (var j = 0; j < obj[1].length; j += 2)
				newObj[i].put(os[j], os[j + 1]);
			break;
		case 32:
			newObj[i].x = os[j];
			newObj[i].y = os[j + 1];
			break;
		case 33:
			newObj[i].origin = new Point(os[0], os[1]);
			newObj[i].corner = new Point(os[2], os[3]);
			break;
		case 34:
		case 35:
			newObj[i].width = os[0];
			newObj[i].height = os[1];
			newObj[i].depth = os[2];
			newObj[i].offset = os[3];
			newObj[i].bits = os[4];
			if (obj[0] == 35) {
				newObj[i].colors = os[5];
			}
		default:
			if (obj[0] > 99) {
				newObj[i].VARS = os;
				if (newObj[i].initFields) {
					newObj[i].initFields(new FieldStream(newObj[i].VARS), obj[2]);
				}
			}
		}
	}
	for (var i = newObj.length - 1; i >= 0; i--) {
		if (newObj[i].initBeforeLoad) {
			newObj[i].initBeforeLoad();
		}
	}
	return newObj[0];
};

ObjectStream.prototype.classForObject = function (obj) {
	if (obj[0] <= 14) {
		return obj[1];
	}
	switch (obj[0]) {
	case 30:
	case 31:
		return obj[1];
	case 20:
	case 21:
		return [];
	case 23:
	case 24:
		return new Dictionary();
	case 32:
		return new Point();
	case 33:
		return new Rectangle();
	case 34:
	case 35:
		return new Form();
	case 105:
		return new TextMorph();
	case 106:
		return new TextMorph();
	case 109:
		return new SampledSound();
	case 124:
		return new SpriteMorph();
	case 125:
		return new StageMorph();
	case 155:
		return new WatcherMorph();
	case 162:
		return new ImageMedia();
	case 164:
		return new SoundMedia();
	case 173:
		return new WatcherReadoutFrameMorph();
	case 174:
		return new SliderMorph();
	default:
		return new Morph();
	}
};


// BinaryStream ///////////////////////////////////////////

function BinaryStream(object) {
	this.object = object;
	this.index = 0;
}

BinaryStream.prototype.available = function () {
	return this.object.length - this.index - 1;
};

BinaryStream.prototype.next = function () {
	if (this.index >= this.object.length) {
		throw 'End of stream';
	}
	return this.object[this.index++];
};

BinaryStream.prototype.nextArray = function (length) {
	var bytes = new Uint8Array(length);
	for (var i = 0; i < length; i++) {
		bytes[i] = this.next();
	}
	return bytes;
};

BinaryStream.prototype.nextString = function (length) {
	var string = '';
	for (var i = 0; i < length; i++) {
		string += String.fromCharCode(this.next());
	}
	return string;
};

BinaryStream.prototype.nextUtf8String = function (length) {
	var istr = this.nextString(length);
	var str = '';
	var i, c, d, e;
	i = 0;

	while (i < istr.length) {
		c = istr.charCodeAt(i);
		if (c < 128) {
			str += String.fromCharCode(c);
			i++;
		} else if ((c > 191) && (c < 224)) {
			d = istr.charCodeAt(i + 1);
			str += String.fromCharCode(((c & 31) << 6) | (d & 63));
			i += 2;
		} else {
			d = istr.charCodeAt(i + 1);
			e = istr.charCodeAt(i + 2);
			str += String.fromCharCode(((c & 15) << 12) | ((d & 63) << 6) | (e & 63));
			i += 3;
		}
	}
	return str;
}

BinaryStream.prototype.nextSignedInt = function (length) {
	var num = 0;
	var j = 1;
	var bytes = this.nextArray(length).reverse();
	for (var i = 0; i < length; i++) {
		var b = bytes[i];
		num += (b * j);
		j *= 256;
	}
	return bytes[length - 1] > 128 ? num - j : num;
};

BinaryStream.prototype.nextUnsignedInt = function (length) {
	var num = 0;
	var j = 1;
	var bytes = this.nextArray(length).reverse();
	for (var i = 0; i < length; i++) {
		var b = bytes[i];
		num += (b * j);
		j *= 256;
	}
	return num;
};