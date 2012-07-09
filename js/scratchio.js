"use strict";

(function (jsc) {
	// FieldStream ////////////////////////////////////////////
	jsc.FieldStream = function (fields) {
		this.fields = fields;
		this.index = -1;
	}

	jsc.FieldStream.prototype.nextField = function () {
		this.index += 1;
		return this.fields[this.index];
	};


	// Ref ////////////////////////////////////////////////////
	jsc.Ref = function (index) {
		this.index = index - 1;
	}


	// ObjectStream ///////////////////////////////////////////
	jsc.ObjectStream = function (stream) {
		this.stream = stream;

		var version = this.readFileHeader();
		if (version === -1) {
			throw 'Not a Scratch project';
		} else if (version < 1) {
			throw 'Project is too old: ' + version;
		}

		this.endOfInfo = stream.getUint32();
	};

	// read the file header (the version of the file)
	jsc.ObjectStream.prototype.readFileHeader = function () {
		return this.stream.getString(8) === 'ScratchV' ? parseFloat(this.stream.getString(2)) : -1;
	};

	// read the next object's header
	jsc.ObjectStream.prototype.readObjectHeader = function () {
		this.temp = this.stream.index;
		return this.stream.getString(10) === 'ObjS\x01Stch\x01';
	};

	// get the next object in the stream
	jsc.ObjectStream.prototype.nextObject = function () {
		if (!this.readObjectHeader()) {
			throw ('Corrupt File');
		}

		var objectSize = this.stream.getUint32(),
			fields = [],
			i;

		for (i = 0; i < objectSize; i += 1) {
			fields[i] = this.readField();
		}
		return this.fixReferences(fields);
	};

	jsc.ObjectStream.prototype.readField = function () {
		var id = this.stream.getUint8();

		if (id === 99) {
			return new jsc.Ref((this.stream.getUint8() << 16) | (this.stream.getUint8() << 8) | (this.stream.getUint8()));
		} else if (id <= 8) {
			return this.readFixedFormat(id);
		} else if (id < 99) {
			return [id, this.readFixedFormat(id)];
		}

		var version = this.stream.getUint8(),
			size = this.stream.getUint8(),
			arr = [];

		for (var i = 0; i < size; i++) {
			arr[i] = this.readField();
		}

		return [id, arr, version, size];
	};

	jsc.ObjectStream.prototype.readFixedFormat = function (id) {
		switch (id) {
		case 1: //nil
			return null;
		case 2: //True
			return true;
		case 3: //False
			return false;
		case 4: //SmallInteger
			return this.stream.getInt32();
		case 5: //SmallInteger16
			return this.stream.getInt16();
		case 6: //LargePositiveInteger
		case 7: //LargeNegativeInteger
			var d1 = 0;
			var d2 = 1;
			var i = this.stream.getInt16();
			for (var j = 0; j < i; j++) {
				var k = this.stream.getUint8();
				d1 += d2 * k;
				d2 *= 256;
			}
			return id == 7 ? -d1 : d1;
		case 8: //Float
			return this.stream.getFloat64();
		case 9: //String
			return this.stream.getString(this.stream.getUint32());
		case 10: //Symbol
			return this.stream.getString(this.stream.getUint32());
		case 11: //ByteArray
			var size = this.stream.getUint32();
			var arr = [];
			for (var i = 0; i < size; i++) {
				arr[i] = this.stream.getUint8();
			}
			return arr;
		case 12: //SoundBuffer
			var size = this.stream.getUint32() * 2;
			var arr = [];
			for (var i = 0; i < size; i++) {
				arr[i] = this.stream.getUint8();
			}
			return arr;
		case 13: //Bitmap
			var size = this.stream.getUint32();
			var arr = [];
			for (var i = 0; i < size; i++) {
				arr[i] = this.stream.getUint32();
			}
			arr.isBitmap = true;
			return arr;
		case 14: //UTF8
			var istr = this.stream.getString(this.stream.getUint32());
			var str = '';
			var i = 0, c, d, e;
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
		case 20: //Array
		case 21: //OrderedCollection
		case 24: //Dictionary
		case 25: //IdentityDictionary
			var arr = [],
				size = (id == 24 || id == 25) ? this.stream.getUint32() * 2 : this.stream.getUint32(),
				i;
			for (i = 0; i < size; i++) {
				arr[i] = this.readField();
			}
			return arr;
		case 30: //Color
			var color = this.stream.getUint32();
			return new jsc.Color(color >> 22 & 0xFF, color >> 12 & 0xFF, color >> 2 & 0xFF);
		case 31: //TranslucentColor
			var color = this.stream.getUint32();
			return new jsc.Color(color >> 22 & 0xFF, color >> 12 & 0xFF, color >> 2 & 0xFF, this.stream.getUint8());
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

	jsc.ObjectStream.prototype.fixReferences = function (objTable) {
		var newObj = [];
		for (var i = 0; i < objTable.length; i++) {
			newObj[i] = this.classForObject(objTable[i]);
		}

		for (var i = 0; i < newObj.length; i++) {
			var obj = objTable[i];
			
			var os = obj[1];
			
			for (var j = 0; j < os.length; j++) {
				if (os[j] instanceof jsc.Ref) {
					os[j] = newObj[os[j].index];
				}
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
				newObj[i].x = os[0];
				newObj[i].y = os[1];
				break;
			case 33:
				newObj[i].origin = new jsc.Point(os[0], os[1]);
				newObj[i].corner = new jsc.Point(os[2], os[3]);
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
					if (newObj[i] instanceof Array) {
						[].push.apply(newObj[i], os);
					} else {
						newObj[i].VARS = os;
						if (newObj[i].initFields) {
							newObj[i].initFields(new jsc.FieldStream(newObj[i].VARS), obj[2]);
						}
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

	jsc.ObjectStream.prototype.classForObject = function (obj) {
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
			return new jsc.Dictionary();
		case 32:
			return new jsc.Point();
		case 33:
			return new jsc.Rectangle();
		case 34:
		case 35:
			return new jsc.Form();
		case 109:
			return new jsc.SampledSound();
		case 124:
			return new jsc.Sprite();
		case 125:
			return new jsc.Stage();
		//case 155:
		//	return new Watcher();
		case 162:
			return new jsc.ImageMedia();
		case 164:
			return new jsc.SoundMedia();
		default:
			return [];
		}
	};
}) (jsc);
