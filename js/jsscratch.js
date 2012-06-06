// LoaderMorph //////////////////////////////////////////////////////////////
var LoaderMorph;

LoaderMorph.prototype = new Morph();
LoaderMorph.prototype.constructor = LoaderMorph;
LoaderMorph.uber = Morph.prototype;

function LoaderMorph(url) {
	this.init(url);
}

LoaderMorph.prototype.init = function (url) {
	LoaderMorph.uber.init.call(this);
	var myself = this;
	this.progressMorph = new ProgressMorph();
	this.add(this.progressMorph);
	this.xhr = new XMLHttpRequest();
	this.xhr.addEventListener('progress', function (e) {
		myself.onprogress(e);
	}, false);
	this.xhr.addEventListener('load', function (e) {
		myself.onload(e);
	}, false);
	this.xhr.addEventListener('error', function (e) {
		myself.onerror(e);
	}, false);
	this.xhr.addEventListener('abort', function (e) {
		myself.onabort(e);
	}, false);
	this.xhr.open('GET', url, true);
	this.xhr.responseType = 'arraybuffer';
};

LoaderMorph.prototype.startLoad = function (e) {
	this.xhr.send(null);
};

LoaderMorph.prototype.onprogress = function (e) {
	if (e.lengthComputable) {
		this.progressMorph.setProgress(this.percentComplete = e.loaded / e.total * 100);
	}
};

LoaderMorph.prototype.onload = function (e) {

};

LoaderMorph.prototype.onerror = function (e) {

};

LoaderMorph.prototype.onabort = function (e) {

};

LoaderMorph.prototype.drawNew = function () {
	if (this.progressMorph) {
		this.progressMorph.setBounds(this.bounds.insetBy(10));
	}
	LoaderMorph.uber.drawNew.call(this);
};


// ProgressMorph //////////////////////////////////////////////////////////////
var ProgressMorph;

ProgressMorph.prototype = new BoxMorph();
ProgressMorph.prototype.constructor = ProgressMorph;
ProgressMorph.uber = BoxMorph.prototype;

function ProgressMorph() {
	this.init();
}

ProgressMorph.prototype.init = function () {
	this.barColor = new Color(0, 120, 200);
	this.percent = 0;
	ProgressMorph.uber.init.call(this);
};

ProgressMorph.prototype.drawNew = function () {
	ProgressMorph.uber.drawNew.call(this);
	var ctx = this.image.getContext('2d'),
		w = this.width(),
		h = this.height(),
		barLoc = w * (this.percent / 100) - this.border * (w / (w - this.border)),
		grad = ctx.createLinearGradient(0, this.border, 0, h - this.border);
	grad.addColorStop(0, this.barColor.lighter(25).toString());
	grad.addColorStop(1, this.barColor.darker(25).toString());

	ctx.beginPath();
	ctx.rect(0, 0, barLoc, h);
	ctx.clip();

	ctx.fillStyle = grad;
	ctx.beginPath();
	this.outlinePath(ctx, Math.max(this.edge - this.border, 0), this.border);
	ctx.closePath();
	ctx.fill();
};

ProgressMorph.prototype.developersMenu = function () {
	var menu = ProgressMorph.uber.developersMenu.call(this);
	menu.addLine();
	menu.addItem('percent...', function () {
		this.prompt(
		menu.title + '\npercent:', this.setProgress, this, this.percent.toString(), null, 0, 100, true);
	}, 'set the percent');
	return menu;
};

ProgressMorph.prototype.setProgress = function (num) {
	this.percent = num.toString();
	this.changed();
	this.drawNew();
	this.changed();
};


// Dictionary //////////////////////////////////////////////////////////////

function Dictionary(keys, values) {
	this.obj = {};
	if (!keys || !values) {
		return;
	}
	for (var i = 0; i < keys.length; i++) {
		obj[keys[i]] = values[i];
	}
}

Dictionary.prototype.at = function (key) {
	return this.obj[key];
};

Dictionary.prototype.put = function (key, value) {
	this.obj[key] = value;
};


// Form //////////////////////////////////////////////////////////////

function Form(width, height, depth, offset, bits, colors) {
	this.width = width;
	this.height = height;
	this.depth = depth;
	this.offset = offset;
	this.bits = bits;
	if (colors) {
		this.colors = colors;
	}
}

Form.prototype.initBeforeLoad = function () {
	var canvas = newCanvas(new Point(this.width, this.height));
	var ctx = canvas.getContext('2d');

	if (!this.bits.isBitmap)
		this.bits = this.decodePixels();

	var data = ctx.createImageData(this.width, this.height);
	this.setImageData(data);
	ctx.putImageData(data, 0, 0);
	this.base64 = canvas.toDataURL();
	this.image = newImage(this.base64);
};

Form.prototype.extent = function () {
	return new Point(this.width, this.height);
};

Form.prototype.decodePixels = function () {
	var stream = new BinaryStream(this.bits);
	var i = this.decodeInt(stream);
	var bitmap = new Uint32Array(i);
	var j = 0;
	while ((stream.available() > 0) && (j < i))
	{
		var k = this.decodeInt(stream);
		var l = k >> 2;
		var i1 = k & 3;
		switch(i1)
		{
		case 0:
			j++;
			break;
		case 1:
			var j1 = stream.next();
			var k1 = j1 << 24 | j1 << 16 | j1 << 8 | j1;
			for (var j2 = 0; j2 < l; j2++)
				bitmap[j++] = k1;
			break;
		case 2:
			var l1 = stream.nextUnsignedInt(4);
			for (var k2 = 0; k2 < l; k2++)
				bitmap[j++] = l1;
			break;
		case 3:
			for (var l2 = 0; l2 < l; l2++)
				bitmap[j++] = stream.nextUnsignedInt(4);
			break;
		}
	}
	return bitmap;
}

Form.prototype.decodeInt = function (stream) {
	var i = stream.next();
	if (i <= 223)
		return i;
	if (i <= 254)
		return (i - 224) * 256 + stream.next();
	return stream.nextUnsignedInt(4);
};

Form.prototype.setImageData = function (data) {
	var array = data.data;
	if (this.depth <= 8)
	{
		var colors = this.colors || squeakColors;
		var l = this.bits.length / this.height;
		var i1 = (1 << this.depth) - 1;
		var j1 = 32 / this.depth;
		for(var y = 0; y < this.height; y++)
		{
			for(var x = 0; x < this.width; x++)
			{
				var i2 = this.bits[y * l + (x - (x % j1)) / j1];
				var j2 = this.depth * (j1 - x % j1 - 1);
				var pi = (y * this.width + x) * 4;
				var ci = i2 >> j2 & i1;
				var c = colors[ci];
				if (c)
				{
					array[pi] = c.r;
					array[pi + 1] = c.g;
					array[pi + 2] = c.b;
					array[pi + 3] = c.a == 0 ? 0 : 255;
				}
			}
		}
	}
	if (this.depth == 16)
	{
		var bits = [];
		var hw = Math.round((this.width) / 2);
		var index, i, j;
		for (var y = 0; y < this.height; y++)
		{
			i = 0;
			for (var x = 0; x < this.width; x++)
			{
				j = this.bits[y * hw + Math.round(x / 2)] >> i & 0xFFFF;
				index = (x + y * this.width) * 4;
				array[index] = (j >> 10 & 0x1F) << 3;
				array[index + 1] = (j >> 5 & 0x1F) << 3;
				array[index + 2] = (j & 0x1F) << 3;
				array[index + 3] = 0xFF;
				i = i == 16 ? 0 : 16;
			}
		}
		this.bits = bits;
	}
	if (this.depth == 32)
	{
		for (var i = 0; i < array.length; i += 4)
		{
			var c = this.bits[i / 4];
			array[i] = (c >> 16) & 0xFF;
			array[i + 1] = (c >> 8) & 0xFF;
			array[i + 2] = c & 0xFF;
			array[i + 3] = this.depth == 16 ? (c >> 24) | 0xFF : 0xFF - ((c >> 24) | 0xFF);
		}
	}
}


// FieldStream //////////////////////////////////////////////////////////////

function FieldStream(fields) {
	this.fields = fields;
	this.index = 0;
}

FieldStream.prototype.nextField = function () {
	this.index += 1;
	return this.fields[this.index - 1];
};


// Ref /////////////////////////////////////////////////////////////////

function Ref(index) {
	this.index = index - 1;
}


// ObjectStream //////////////////////////////////////////////////////////////

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
	return this.stream.nextString(4) === 'ObjS' && this.stream.next() === 1 && this.stream.nextString(4) === 'Stch' && this.stream.next() === 1;
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
	return this.fixRefs(fields);
};

ObjectStream.prototype.readField = function () {
	var id = this.stream.next();

	if (id === 99) {
		return new Ref(this.stream.nextUnsignedInt(3));
	}
	if (id <= 8) {
		return this.readFixedFormat(id);
	}
	if (id < 99) {
		return [id, this.readFixedFormat(id)];
	}

	var version = this.stream.next(),
		size = this.stream.next(),
		arr = [];

	for (var i = 0; i < size; i++) arr[i] = this.readField();

	return [id, arr, version, size];
};

ObjectStream.prototype.readFixedFormat = function (id) {
	switch (id) {
	case 1:
		//nil
		return null;
	case 2:
		//True
		return true;
	case 3:
		//False
		return false;
	case 4:
		//SmallInteger
		return this.stream.nextSignedInt(4);
	case 5:
		//SmallInteger16
		return this.stream.nextSignedInt(2);
	case 6:
		//LargePositiveInteger
	case 7:
		//LargeNegativeInteger
		var d1 = 0;
		var d2 = 1;
		var i = this.stream.nextUnsignedInt(2);
		for (var j = 0; j < i; j++)
		{
			var k = this.stream.next();
			d1 += d2 * k;
			d2 *= 256;
		}
		return id == 7 ? -d1 : d1;
	case 8:
		//Float
		var bv = new Uint8Array(8);
		for (var i = 7; i >= 0; i--)
			bv[i] = this.stream.next();
		return new Float64Array(bv.buffer)[0];
	case 9:
		//String
		return this.stream.nextString(this.stream.nextUnsignedInt(4));
	case 10:
		//Symbol
		return this.stream.nextString(this.stream.nextUnsignedInt(4));
	case 11:
		//ByteArray
		return this.stream.nextArray(this.stream.nextUnsignedInt(4));
	case 12:
		//SoundBuffer
		return this.stream.nextArray(this.stream.nextUnsignedInt(4) * 2);
	case 13:
		//Bitmap
		var size = this.stream.nextUnsignedInt(4);
		var arr = new Uint32Array(size);
		for (var i = 0; i < size; i += 1)
			arr[i] = this.stream.nextUnsignedInt(4);
		arr.isBitmap = true;
		return arr;
	case 14:
		//UTF8
		return this.stream.nextString(this.stream.nextUnsignedInt(4));
	case 20:
		//Array
	case 21:
		//OrderedCollection
	case 24:
		//Dictionary
	case 25:
		//IdentityDictionary
		var arr = [],
			size = (id == 24 || id == 25) ? this.stream.nextUnsignedInt(4) * 2 : this.stream.nextUnsignedInt(4),
			i;
		for (i = 0; i < size; i++) {
			arr[i] = this.readField();
		}
		return arr;
	case 30:
		//Color
		var color = this.stream.nextUnsignedInt(4);
		return new Color(color >> 22 & 0xFF, color >> 12 & 0xFF, color >> 2 & 0xFF);
	case 31:
		//TranslucentColor
		var color = this.stream.nextUnsignedInt(4);
		return new Color(color >> 22 & 0xFF, color >> 12 & 0xFF, color >> 2 & 0xFF, this.stream.next());
	case 32:
		//Point
		return [this.readField(), this.readField()];
	case 33:
		//Rectangle
		return [this.readField(), this.readField(), this.readField(), this.readField()];
	case 34:
		//Form
		return [this.readField(), this.readField(), this.readField(), this.readField(), this.readField()];
	case 35:
		//ColorForm
		return [this.readField(), this.readField(), this.readField(), this.readField(), this.readField(), this.readField()];
	}
	throw 'Unknown object: ' + id;
};

ObjectStream.prototype.fixRefs = function (objTable) {
	var newObj = [];
	for (var i = 0; i < objTable.length; i++)
		newObj[i] = this.classForObject(objTable[i]);

	for (var i = 0; i < newObj.length; i++) {
		var obj = objTable[i];
		switch (obj[0]) {
		case 20:
		case 21:
			for (var j = 0; j < obj[1].length; j++)
			newObj[i].push(obj[1][j] instanceof Ref ? newObj[obj[1][j].index] : obj[1][j]);
			break;
		case 24:
		case 25:
			for (var j = 0; j < obj[1].length; j += 2)
			newObj[i].put(obj[1][j] instanceof Ref ? newObj[obj[1][j].index] : obj[1][j], obj[1][j + 1] instanceof Ref ? newObj[obj[1][j + 1].index] : obj[1][j + 1]);
			break;
		case 32:
			newObj[i].x = obj[1][0] instanceof Ref ? newObj[obj[1][0].index] : obj[1][0];
			newObj[i].y = obj[1][1] instanceof Ref ? newObj[obj[1][1].index] : obj[1][1];
			break;
		case 33:
			newObj[i].origin = new Point(obj[1][0] instanceof Ref ? newObj[obj[1][0].index] : obj[1][0], obj[1][1] instanceof Ref ? newObj[obj[1][1].index] : obj[1][1]);
			newObj[i].corner = new Point(obj[1][2] instanceof Ref ? newObj[obj[1][2].index] : obj[1][2], obj[1][3] instanceof Ref ? newObj[obj[1][3].index] : obj[1][3]);
			break;
		case 34:
		case 35:
			newObj[i].width = obj[1][0] instanceof Ref ? newObj[obj[1][0].index] : obj[1][0];
			newObj[i].height = obj[1][1] instanceof Ref ? newObj[obj[1][1].index] : obj[1][1];
			newObj[i].depth = obj[1][2] instanceof Ref ? newObj[obj[1][2].index] : obj[1][2];
			newObj[i].offset = obj[1][3] instanceof Ref ? newObj[obj[1][3].index] : obj[1][3];
			newObj[i].bits = obj[1][4] instanceof Ref ? newObj[obj[1][4].index] : obj[1][4];
			if (obj[0] == 35) newObj[i].colors = obj[1][5] instanceof Ref ? newObj[obj[1][5].index] : obj[1][5];

		default:
			if (obj[0] > 99) {
				newObj[i].VARS = [];
				for (var j = 0; j < obj[1].length; j++)
				newObj[i].VARS.push((obj[1][j] instanceof Ref) ? newObj[obj[1][j].index] : obj[1][j]);
				if (newObj[i].initFields) newObj[i].initFields(new FieldStream(newObj[i].VARS), obj[2]);
			}
		}
	}
	for (var i = newObj.length - 1; i >= 0; i--)
		if (newObj[i].initBeforeLoad)
			newObj[i].initBeforeLoad();
	return newObj[0];
};

ObjectStream.prototype.classForObject = function (obj) {
	switch (obj[0]) {
	case 1:
	case 2:
	case 3:
	case 4:
	case 5:
	case 6:
	case 7:
	case 8:
	case 9:
	case 10:
	case 11:
	case 12:
	case 13:
	case 14:
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


// BinaryStream //////////////////////////////////////////////////////////////

function BinaryStream(object) {
	this.object = object;
	this.index = 0;
}

BinaryStream.prototype.available = function () {
	return this.object.length - this.index - 1;
};

BinaryStream.prototype.next = function () {
	if (this.index >= this.object.length) throw 'End of stream'
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


// PlayerFrameMorph ////////////////////////////////////////////////////////
var PlayerFrameMorph;

PlayerFrameMorph.prototype = new Morph();
PlayerFrameMorph.prototype.constructor = PlayerFrameMorph;
PlayerFrameMorph.uber = Morph.prototype;

function PlayerFrameMorph() {
	this.init();
}

PlayerFrameMorph.prototype.init = function () {
	this.toolbarColor = new Color(128, 128, 128);
	this.borderColor = new Color(0, 0, 0);
	var myself = this;
	this.goButton = new ButtonMorph(function () {
		if (this.world().currentKey == 16) {
			myself.stage.setTurbo(!myself.stage.turbo);
		} else {
			myself.stage.start();
		}
	}, 'data:image/gif;base64,R0lGODlhFAARAKIAAAAAAP///wK7AkZGRv///wAAAAAAAAAAACH5BAEAAAQALAAAAAAUABEAAAM7SKrT6yu+IUSjFkrSqv/WxmHgpzFlGjKk6g2TC8KsbD72G+freGGX2UOi6WRYImLvlBxNmk0adMOcKhIAOw==', 'data:image/gif;base64,R0lGODlhFAARAKIAAAAAAP///wD/AEZGRv///wAAAAAAAAAAACH5BAEAAAQALAAAAAAUABEAAAM7SKrT6yu+IUSjFkrSqv/WxmHgpzFlGjKk6g2TC8KsbD72G+freGGX2UOi6WRYImLvlBxNmk0adMOcKhIAOw==');
	this.goButton.bounds = new Rectangle(0, 0, 20, 17);
	this.stopButton = new ButtonMorph(function () {
		myself.stage.stopAll();
	}, 'data:image/gif;base64,R0lGODlhEQARAKIAAAAAAP///0ZFQ8cAAP///wAAAAAAAAAAACH5BAEAAAQALAAAAAARABEAAAMvSKrSLiuyQeuAkgjL8dpc94UkBJJhg5bnWqmuBcfUTNuxSV+j602oX0+UYTwakgQAOw==', 'data:image/gif;base64,R0lGODlhEQARAKIAAAAAAP///0ZFQ+8AAP///wAAAAAAAAAAACH5BAEAAAQALAAAAAARABEAAAMvSKrSLiuyQeuAkgjL8dpc94UkBJJhg5bnWqmuBcfUTNuxSV+j602oX0+UYTwakgQAOw==');
	this.stopButton.bounds = new Rectangle(0, 0, 20, 17);
	this.messageMorph = new StringMorph(version);
	this.messageMorph.changed();
	this.messageMorph.drawNew();
	PlayerFrameMorph.uber.init.call(this);
	this.add(this.goButton);
	this.add(this.stopButton);
	this.add(this.messageMorph);
};

PlayerFrameMorph.prototype.drawNew = function () {
	this.goButton.bounds = new Rectangle(this.width() - 64, 4, this.width() - 44, 21);
	this.stopButton.bounds = new Rectangle(this.width() - 31, 4, this.width() - 14, 21);
	this.messageMorph.bounds = new Rectangle(5, 4, this.width() - 80, 17);

	if (this.stage) {
		this.stage.bounds = new Rectangle(1, 26, this.width() - 1, this.height() - 1);
	}

	var ctx;
	this.image = newCanvas(this.extent());
	ctx = this.image.getContext('2d');
	ctx.fillStyle = this.toolbarColor.toString();
	ctx.fillRect(1, 1, this.width() - 2, 24);
	ctx.strokeStyle = this.borderColor.toString();
	ctx.lineWidth = 2;
	ctx.strokeRect(0, 0, this.width(), this.height());
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.moveTo(0.5, 25.5);
	ctx.lineTo(this.width() - 0.5, 25.5);
	ctx.stroke();
};

PlayerFrameMorph.prototype.setStage = function (stage) {
	this.stage = stage;
	this.stage.setPosition(new Point(1, 26));
	this.stage.drawNew();
	this.addBack(stage);
	this.stage.setup();
	this.drawNew();
}

PlayerFrameMorph.prototype.setup = function () {
	this.bounds = worldMorph.bounds;
	if (!projectUrl) return;
	var myself = this,
		loader = new LoaderMorph(projectUrl),
		hw = this.width() / 2,
		hh = this.height() / 2;
	loader.onload = function (e) {
		myself.read(window.VBArray ? new VBArray(player.loader.xhr.responseBody).toArray() : window.Uint8Array ? new Uint8Array(player.loader.xhr.response) : alert('Browser unsupported. :('));
		this.destroy();
	};
	loader.setPosition(new Point(hw - 100, hh - 50));
	loader.setExtent(new Point(200, 100));
	this.add(loader);
	loader.startLoad();
	this.loader = loader;
	this.changed();
	this.drawNew();
	this.changed();
};

PlayerFrameMorph.prototype.read = function (file) {
	if (this.stage) {
		this.stage.destroy();
	}
	var objectStream = new ObjectStream(new BinaryStream(file));
	this.info = objectStream.nextObject();
	var stage = objectStream.nextObject()
	this.setStage(stage);
	if (this.loader.xhr.getResponseHeader('Content-Disposition')) {
		var vars = [], hash, hashes = this.loader.xhr.getResponseHeader('Content-Disposition').split(';'), i;
		for(i = 0; i < hashes.length; i++) {
			hash = hashes[i].split('=');
			if (hash[1])
				vars[hash[0]] = hash[1].substr(1, hash[1].length - 2);
		}
		setName(vars['filename']);
	}
	worldMorph.fullChanged();
	worldMorph.drawNew();
	worldMorph.fullChanged();
	var redrawChildren = function (morph) {
		morph.children.forEach(function (child) {
			child.changed();
			child.drawNew();
			child.changed();
			redrawChildren(child);
		});
	};
	setTimeout(function () {
		stage.changed();
		stage.drawNew();
		stage.changed();
		redrawChildren(stage);
	}, 0);
	setTimeout(function () { //give all images time to load
		stage.changed();
		stage.drawNew();
		stage.changed();
		redrawChildren(stage);
	}, 1000);
};


// ButtonMorph ////////////////////////////////////////////////////////
var ButtonMorph;

ButtonMorph.prototype = new Morph();
ButtonMorph.prototype.constructor = ButtonMorph;
ButtonMorph.uber = Morph.prototype;

function ButtonMorph(onClick, normal, over) {
	this.init(onClick, normal, over);
}

ButtonMorph.prototype.init = function (onClick, normal, over) {
	ButtonMorph.uber.init.call(this);
	this.color = new Color(0, 0, 0, 0);
	this.onClickLeft = onClick;
	var myself = this;
	this.normalTexture = newImage(normal, function () {
		myself.texture = myself.normalTexture.src;
		myself.cachedTexture = myself.normalTexture;
		myself.changed();
		myself.drawNew();
	});
	this.overTexture = newImage(over);
};

ButtonMorph.prototype.mouseLeave = function () {
	if (!this.normalTexture.loaded) return;
	this.texture = this.normalTexture.src;
	this.cachedTexture = this.normalTexture;
	this.changed();
	this.drawNew();
	this.changed();
};

ButtonMorph.prototype.mouseEnter = function () {
	if (!this.overTexture.loaded) return;
	this.texture = this.overTexture.src;
	this.cachedTexture = this.overTexture;
	this.changed();
	this.drawNew();
	this.changed();
};

ButtonMorph.prototype.mouseClickLeft = function () {
	if (this.onClickLeft) this.onClickLeft();
};

TextMorph.prototype.initFields = function (fields, version) {
	TextMorph.uber.initFields.call(this, fields, version);
	initFieldsNamed.call(this, ['fontStyle', 'emphasis', 'text'], fields);
};

TextMorph.prototype.initBeforeLoad = function () {
	this.fontSize = this.fontStyle[1];
	var f = this.fontStyle[0];
	if (f.indexOf('Bold', f.length - 4) !== -1) {
		this.fontStyle = f.substr(0, f.length - 4);
		this.isBold = true;
	}
};

// ScriptableMorph ////////////////////////////////////////////////////////
var ScriptableMorph;

ScriptableMorph.prototype = new Morph();
ScriptableMorph.prototype.constructor = ScriptableMorph;
ScriptableMorph.uber = Morph.prototype;

function ScriptableMorph() {
	this.init();
}

ScriptableMorph.prototype.init = function () {
	ScriptableMorph.uber.init.call(this);
	this.threads = [];
	this.fps = 60;
};

ScriptableMorph.prototype.initFields = function (fields, version) {
	ScriptableMorph.uber.initFields.call(this, fields, version);
	initFieldsNamed.call(this, ['objName', 'variables', 'blocksBin', 'isClone', 'media', 'costume'], fields);
};

ScriptableMorph.prototype.initBeforeLoad = function () {
	for (var i = 0; i < this.blocksBin.length; i++) {
		if (['EventHatMorph', 'KeyEventHatMorph', 'MouseClickEventHatMorph'].indexOf(this.blocksBin[i][1][0][0]) != -1) {
			this.threads.push(new Thread(this, this.blocksBin[i][1]));
		}
	}

	for (key in this.lists.obj) {
		this.lists.put(key, this.lists.at(key).VARS[9]);
	}
	
	for (key in this.variables.obj) {
		if (!(this.variables.at(key) instanceof Array)) {
			this.variables.put(key, [this.variables.at(key)]);
		}
	}
};

ScriptableMorph.prototype.drawNew = function () {
	this.needsRedraw = false
	if (!this.costume)
	{
		ScriptableMorph.uber.drawNew.call(this);
		return;
	}
	this.image = newCanvas(this.extent());
	var ctx = this.image.getContext('2d');
	if (this.costume.image.loaded)
		ctx.drawImage(this.costume.image, 0, 0);
};

ScriptableMorph.prototype.getStage = function () {
	if (this.parent instanceof StageMorph) {
		return this.parent;
	} else if (this instanceof StageMorph) {
		return this;
	}
	return null;
};

ScriptableMorph.prototype.stepThreads = function () {
	for (var i = 0; i < this.threads.length; i++) {
		this.threads[i].step();
	}
};

ScriptableMorph.prototype.isRunning = function () {
	for (var i = 0; i < this.threads.length; i++) {
		if (!this.threads[i].done) {
			return true;
		}
	}
	return false;
};

ScriptableMorph.prototype.broadcast = function (broadcast) {
	for (var i = 0; i < this.threads.length; i++) {
		if (this.threads[i].hat[0] === 'EventHatMorph' && this.threads[i].hat[1].toLowerCase() === broadcast.toLowerCase()) {
			this.threads[i].start();
		}
	}
};

ScriptableMorph.prototype.stopAll = function () {
	for (var i = 0; i < this.threads.length; i++) {
		this.threads[i].stop();
	}
};

ScriptableMorph.prototype.evalCommand = function (command, args) {
	switch (command) {
	case 'broadcast:':
		return this.getStage().addBroadcastToQuene(args[0].toString());

	case 'lookLike:':
		var costume = null;
		for (var i = 0; i < this.media.length; i++) {
			if (this.media[i] instanceof ImageMedia && this.media[i].mediaName.toLowerCase() === args[0].toLowerCase()) {
				costume = this.media[i];
			}
		}

		if (costume) {
			this.costume = costume;
			this.fixLayout();
		}
		return;
	case 'say:':
		return console.log(args[0]);

	case 'mouseX':
		return this.world().hand.position().x - this.getStage().center().x;
	case 'mouseY':
		return -(this.world().hand.position().y - this.getStage().center().y);
	case 'timerReset':
		return this.getStage().timer.reset();
	case 'timer':
		return this.getStage().timer.getElapsed() / 1000;

	case '+':
		return (parseFloat(args[0]) || 0) + (parseFloat(args[1]) || 0);
	case '-':
		return (parseFloat(args[0]) || 0) - (parseFloat(args[1]) || 0);
	case '*':
		return (parseFloat(args[0]) || 0) * (parseFloat(args[1]) || 0);
	case '/':
		return (parseFloat(args[0]) || 0) / (parseFloat(args[1]) || 0);
	case '<':
		var a = parseFloat(args[0]);
		var b = parseFloat(args[1]);
		return (isNaN(a) ? args[0] : a) < (isNaN(b) ? args[1] : b);
	case '=':
		return args[0].toString().toLowerCase() == args[1].toString().toLowerCase();
	case '>':
		var a = parseFloat(args[0]);
		var b = parseFloat(args[1]);
		return (isNaN(a) ? args[0] : a) > (isNaN(b) ? args[1] : b);
	case 'concatenate:with:':
		return args[0].toString() + args[1].toString();
	case 'letter:of:':
		return args[1].toString()[(parseFloat(args[0]) || 0) - 1] || '';
	case 'stringLength:':
		return args[0].toString().length;
	case '\\\\':
		return (parseFloat(args[0]) || 0).mod(parseFloat(args[1]) || 0);
	case 'rounded':
		return Math.round(parseFloat(args[0]) || 0);
	case 'computeFunction:of:':
		var n = parseFloat(args[1]) || 0;
		switch (args[0].toString().toLowerCase()) {
		case 'abs': return Math.abs(n);
		case 'sqrt': return Math.sqrt(n);
		case 'sin': return Math.sin(Math.PI/180 * n);
		case 'cos': return Math.cos(Math.PI/180 * n);
		case 'tan': return Math.tan(Math.PI/180 * n);
		case 'asin': return 180/Math.PI * Math.asin(Math.max(-1, Math.min(1, n)));
		case 'acos': return 180/Math.PI * Math.acos(Math.max(-1, Math.min(1, n)));
		case 'atan': return 180/Math.PI * Math.atan(n);
		case 'ln': return Math.log(n);
		case 'log': return Math.log(n);
		case 'e ^': return Math.pow(Math.E, n);
		case '10 ^': return Math.pow(10, n);
		}
		return 0;

	case 'clearPenTrails':
		var canvas = this.getStage().penCanvas;
		var ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		return this.getStage().fixLayout();

	case 'readVariable':
		return this.getVariable(args[0].toString());
	case 'changeVariable':
		return this.changeVariable(args[0], args[2], args[1] === 'changeVar:by:');

	case 'getLine:ofList:':
		return this.getList(args[1].toString())[(parseFloat(args[0]) || 0) - 1];
	case 'lineCountOfList:':
		return this.getList(args[0].toString()).length;
	default:
		throw 'Unknown command: ' + command;
	}
};

ScriptableMorph.prototype.fixLayout = function () {
	this.needsRedraw = true;
}

ScriptableMorph.prototype.isStage = function () {
	return false;
};

ScriptableMorph.prototype.getVariable = function (name) {
	return this.variables.at(name) === undefined ? this.getStage().variables.at(name)[0] : this.variables.at(name)[0];
};

ScriptableMorph.prototype.changeVariable = function (name, value, relative) {
	var o = this.getStage().variables;
	if (this.variables.at(name) !== undefined) {
		o = this.variables;
	}
	o = o.at(name);
	if (relative) {
		o[0] = parseFloat(o || 0) + parseFloat(value) || 0;
	} else {
		o[0] = value;
	}
	if (o[1]) {
		o[1].needsUpdate = true;
	}
};

ScriptableMorph.prototype.addWatcher = function (variable, watcher) {
	if (this.variables.at(variable) instanceof Array) {
		this.variables.at(variable).push(watcher);
	} else {
		this.variables.put(variable, [this.variables.at(variable), watcher]);
	}
};

ScriptableMorph.prototype.getList = function (name) {
	return this.lists.at(name) === undefined ? this.getStage().lists.at(name) : this.lists.at(name);
};


// StageMorph ////////////////////////////////////////////////////////
var StageMorph;

StageMorph.prototype = new ScriptableMorph();
StageMorph.prototype.constructor = StageMorph;
StageMorph.uber = ScriptableMorph.prototype;

function StageMorph() {
	this.init();
}

StageMorph.prototype.init = function () {
	StageMorph.uber.init.call(this);
	this.turbo = false;
	this.broadcastQuene = [];
	this.timer = new Stopwatch();
};

StageMorph.prototype.initFields = function (fields, version) {
	StageMorph.uber.initFields.call(this, fields, version);
	initFieldsNamed.call(this, ['zoom', 'hPan', 'vPan'], fields);
	if (version == 1) return;
	initFieldsNamed.call(this, ['obsoleteSavedState'], fields);
	if (version == 2) return;
	initFieldsNamed.call(this, ['sprites'], fields);
	if (version == 3) return;
	initFieldsNamed.call(this, ['volume', 'tempoBPM'], fields);
	if (version == 4) return;
	initFieldsNamed.call(this, ['sceneStates', 'lists'], fields);
};

StageMorph.prototype.initBeforeLoad = function () {
	StageMorph.uber.initBeforeLoad.call(this);
	this.watchers = this.allChildren().filter(function (m) {
		return m instanceof WatcherMorph;
	});
};

StageMorph.prototype.setup = function () {
	var canvas = this.world().worldCanvas;
	var myself = this;
	
	/*canvas.addEventListener(
		"mousemove",
		function (event) {
			myself.;
		},
		false
	);*/
};

StageMorph.prototype.step = function () {
	StageMorph.uber.step.call(this);
	if (this.turbo && this.isRunning()) {
		var stopwatch = new Stopwatch();
		while (stopwatch.getElapsed() < 50) {
			this.stepThreads();
		}
	} else {
		this.stepThreads();
	}

	for (var i = 0; i < this.sprites.length; i++) {
		if (this.sprites[i].needsRedraw) {
			this.sprites[i].drawNew();
		}
	}
		this.drawNew();
	
	if (this.needsRedraw) {
		this.drawNew();
	}

	
	for (var i = 0; i < this.watchers.length; i++) {
		this.watchers[i].update();
	}
};

StageMorph.prototype.stepThreads = function () {
	for (var i = 0; i < this.broadcastQuene.length; i++) {
		this.broadcast(this.broadcastQuene[i]);
		for (var j = 0; j < this.sprites.length; j++) {
			this.sprites[j].broadcast(this.broadcastQuene[i]);
		}
	}
	this.broadcastQuene = [];
	for (var i = 0; i < this.sprites.length; i++) {
		this.sprites[i].stepThreads();
	}
	StageMorph.uber.stepThreads.call(this);
};

StageMorph.prototype.isRunning = function () {
	var running = StageMorph.uber.isRunning.call(this);
	
	for (var i = 0; i < this.sprites.length; i++) {
		running = running || this.sprites[i].isRunning();
	}
	return running;
};

StageMorph.prototype.isStage = function () {
	return true;
};

StageMorph.prototype.evalCommand = function (command, args) {
	switch (command) {
	default:
		return StageMorph.uber.evalCommand.call(this, command, args);
	}
};

StageMorph.prototype.drawNew = function () {
	StageMorph.uber.drawNew.call(this);
	if (this.penCanvas) {
		var ctx = this.image.getContext('2d');
		ctx.drawImage(this.penCanvas, 0, 0);
	}
};

StageMorph.prototype.addBroadcastToQuene = function (broadcast) {
	this.broadcastQuene.push(broadcast);
};

StageMorph.prototype.stopAll = function () {
	for (var i = 0; i < this.sprites.length; i++) {
		this.sprites[i].stopAll();
	}
	StageMorph.uber.stopAll.call(this);
};

StageMorph.prototype.start = function () {
	this.addBroadcastToQuene('Scratch-StartClicked');
};

StageMorph.prototype.setTurbo = function (flag) {
	this.turbo = flag;
	var fps = flag ? 0 : 60;
	this.fps = fps;
};


// SpriteMorph ////////////////////////////////////////////////////////
var SpriteMorph;

SpriteMorph.prototype = new ScriptableMorph();
SpriteMorph.prototype.constructor = SpriteMorph;
SpriteMorph.uber = ScriptableMorph.prototype;

function SpriteMorph() {
	this.init();
}

SpriteMorph.prototype.init = function () {
	SpriteMorph.uber.init.call(this);
};

SpriteMorph.prototype.initFields = function (fields, version) {
	SpriteMorph.uber.initFields.call(this, fields, version);
	initFieldsNamed.call(this, ['visibility', 'scalePoint', 'heading', 'rotationStyle'], fields);
	if (version == 1) return;
	initFieldsNamed.call(this, ['volume', 'tempoBPM', 'draggable'], fields);
	if (version == 2) return;
	initFieldsNamed.call(this, ['sceneStates', 'lists'], fields);
};

SpriteMorph.prototype.initBeforeLoad = function () {
	SpriteMorph.uber.initBeforeLoad.call(this);
	this.offset = new Point(0, 0);
	this.setHeading(this.heading + 90);
	this.fixLayout();
	this.moveBy(this.offset.multiplyBy(-1));
};

SpriteMorph.prototype.evalCommand = function (command, args) {
	switch (command) {
	case 'forward:':
		var rad = Math.PI/180 * this.heading;
		var v = parseFloat(args[0]) || 0;
		return this.setRelativePosition(this.relativePosition().add(new Point(Math.sin(rad) * v, Math.cos(rad) * v)));
	case 'heading:':
		return this.setHeading(parseFloat(args[0]) || 0);
	case 'turnRight:':
		return this.setHeading(this.heading + (parseFloat(args[0]) || 0));
	case 'turnLeft:':
		return this.setHeading(this.heading + (parseFloat(args[0]) || 0));
	case 'gotoX:y:':
		return this.setRelativePosition(new Point(parseFloat(args[0]) || 0, parseFloat(args[1]) || 0));
	case 'changeXposBy:':
		return this.setRelativePosition(new Point(this.relativePosition().x + (parseFloat(args[0]) || 0), this.relativePosition().y));
	case 'xpos:':
		return this.setRelativePosition(new Point(parseFloat(args[0]) || 0, this.relativePosition().y));
	case 'changeYposBy:':
		return this.setRelativePosition(new Point(this.relativePosition().x, this.relativePosition().y + (parseFloat(args[0]) || 0)));
	case 'ypos:':
		return this.setRelativePosition(new Point(this.relativePosition().x, parseFloat(args[0]) || 0));
	case 'xpos':
		return this.relativePosition().x;
	case 'ypos':
		return this.relativePosition().y;
	case 'heading':
		return this.heading;

	case 'show':
		return this.show();
	case 'hide':
		return this.hide();
	default:
		return SpriteMorph.uber.evalCommand.call(this, command, args);
	}
};

SpriteMorph.prototype.relativePosition = function () {
	return this.topLeft().add(this.offset.add(this.costume.rotationCenter)).subtract(this.getStage().center()).multiplyBy(new Point(1, -1));
};

SpriteMorph.prototype.setRelativePosition = function (point) {
	var t3 = this.costume.rotationCenter;
	var t7 = this.costume.extent().divideBy(2);
	var t8 = radians(-(this.heading - 90).mod(360));
	var t17 = this.extent();
	var t18 = t3.subtract(t7).round();//for scale: .multiplyBy(scale);
	var t19 = t17.divideBy(2).add(t18.rotateBy(t8));
	this.offset = t19.subtract(t3);
	this.setPosition(this.getStage().center().subtract(this.costume.rotationCenter.add(this.offset)).add(new Point(point.x, -point.y)));
};

SpriteMorph.prototype.setHeading = function (angle) {
	this.heading = ((angle + 179).mod(360) - 179);
	this.fixLayout();
};

SpriteMorph.prototype.drawNew = function () {
	if (!this.costume)
	{
		ScriptableMorph.uber.drawNew.call(this);
		return;
	}
	this.image = newCanvas(this.extent());
	var ctx = this.image.getContext('2d');
	if (this.costume.image.loaded) {
		var form = this.costume.form;
		var r = radians(this.heading);
		var center = new Point(form.width / 2, form.height / 2);
		var offset = new Point(Math.abs(Math.sin(r)) * form.width + Math.abs(Math.cos(r)) * form.height, Math.abs(Math.cos(r)) * form.width + Math.abs(Math.sin(r)) * form.height).divideBy(2);
		ctx.save();
		ctx.translate(offset.x, offset.y);
		ctx.rotate(radians(this.heading - 90));
		ctx.translate(-center.x, -center.y);
		ctx.drawImage(this.costume.image, 0, 0);
		ctx.restore();
	}
};

SpriteMorph.prototype.fixLayout = function () {
	SpriteMorph.uber.fixLayout.call(this);
	var form = this.costume.form;
	var r = radians(this.heading);
	this.changed();
	this.silentSetExtent(new Point(Math.abs(Math.sin(r)) * form.width + Math.abs(Math.cos(r)) * form.height, Math.abs(Math.cos(r)) * form.width + Math.abs(Math.sin(r)) * form.height))
	var rc = this.costume.rotationCenter;
	this.offset = this.extent().divideBy(2).add(rc.subtract(this.costume.extent().divideBy(2)).round().rotateBy(radians(-(this.heading - 90).mod(360)))).subtract(rc);
	this.setRelativePosition(this.relativePosition());
};

// Thread /////////////////////////////////////////////////////////////

function Thread(object, script) {
	this.init(object, script);
}

Thread.prototype.init = function (object, script) {
	this.object = object;
	this.hat = script[0];
	this.wholeScript = this.script = script.slice(1, script.length);
	this.done = true;
};

Thread.prototype.start = function () {
	this.index = 0;
	this.stack = [];
	this.done = this.yield = false;
	this.timer = null;
	this.temp = -1;
	this.script = this.wholeScript;
};

Thread.prototype.stop = function () {
	this.index = 0;
	this.stack = [];
	this.done = this.yield = true;
	this.timer = null;
	this.temp = -1;
	this.script = this.wholeScript;
};

Thread.prototype.step = function () {
	if (this.done) {
		return;
	}

	this.yield = false;

	while (!this.yield && !this.done) {
		if (this.index >= this.script.length) {
			if (this.stack.length == 0) {
				this.done = true;
			} else {
				this.popState();
			}
		} else {
			this.evalCommand(this.script[this.index]);
			this.index++;
		}
	}
};

Thread.prototype.evalCommand = function (block) {
	var selector = block[0];

	switch (selector)
	{
	case 'doIf':
		if (this.evalArg(block[1])) {
			this.evalCommandList(block[2], false);
		}
		return;
	case 'doIfElse':
		this.evalCommandList(this.evalArg(block[1]) ? block[2] : block[3], false);
		return;
	case 'doRepeat':
		if (this.temp == -1) {
			this.temp = parseInt(this.evalArg(block[1])) || 0;
		}
		if (this.temp <= 0) {
			this.temp = -1;
			return;
		}

		this.temp--;
		this.evalCommandList(block[2], true);
		return;
	case 'doUntil':
		if (this.evalArg(block[1]))
			this.evalCommandList(block[2], true);
		return;
	case 'doForever':
		this.evalCommandList(block[1], true);
		return;
	case 'doReturn':
		this.stop();
		return;
	case 'wait:elapsed:from:':
		if (this.timer == null) {
			this.timer = new Stopwatch();
			this.evalCommandList([], true);
		} else if (this.timer.getElapsed() < parseFloat(block[1]) * 1000) {
			this.evalCommandList([], true);
		}
		return;
	}

	var args = [];
	for (var i = 1; i < block.length; i++) {
		args.push(this.evalArg(block[i]));
	}

	//try {
		return this.object.evalCommand(selector, args);
	//} catch (e) {
		//if (!(e instanceof UnknownSelectorError)) {
			//throw e;
		//}
	//	this.stop();
	//}
};

Thread.prototype.evalArg = function (arg) {
	if (arg instanceof Array) {
		return this.evalCommand(arg);
	}
	return arg;
};

Thread.prototype.evalCommandList = function (commands, repeat) {
	if (!repeat) {
		this.index++;
	} else {
		this.yield = true;
	}
	this.pushState();
	this.temp = -1;
	if (!commands) {
		this.script = [];
	} else {
		this.script = commands;
	}
	this.index = -1;
};

Thread.prototype.pushState = function () {
	var array = [];
	array.push(this.script);
	array.push(this.index);
	array.push(this.timer);
	array.push(this.temp);
	this.stack.push(array);
};

Thread.prototype.popState = function () {
	if (this.stack.length == 0)
	{
		this.script = [];
		this.index = 0;
		this.done = this.yield = true;
		return;
	}

	var oldState = this.stack.pop();
	this.script = oldState[0];
	this.index = oldState[1];
	this.timer = oldState[2];
	this.temp = oldState[3];
};


// Stopwatch ///////////////////////////////////////////////////////////

function Stopwatch() {
	this.init();
}

Stopwatch.prototype.init = function () {
	this.startTime = new Date().getTime();
};

Stopwatch.prototype.reset = function () {
	this.startTime = new Date().getTime();
};

Stopwatch.prototype.getElapsed = function () {
	return new Date().getTime() - this.startTime;
};


// ScratchMedia ////////////////////////////////////////////////////////

function ScratchMedia() {
	this.mediaName = null;
}

ScratchMedia.prototype.initFields = function (fields, version) {
	initFieldsNamed.call(this, ['mediaName'], fields);
};


// ImageMedia ////////////////////////////////////////////////////////
var ImageMedia;

ImageMedia.prototype = new ScratchMedia();
ImageMedia.prototype.constructor = ImageMedia;
ImageMedia.uber = ScratchMedia.prototype;

function ImageMedia() {

}

ImageMedia.prototype.initFields = function (fields, version) {
	ImageMedia.uber.initFields.call(this, fields, version);
	initFieldsNamed.call(this, ['form', 'rotationCenter'], fields);
	//this.compositeForm = this.jpegBytes = null;
	if (version == 1) return;
	initFieldsNamed.call(this, ['textBox'], fields);
	if (version == 2) return;
	initFieldsNamed.call(this, ['jpegBytes'], fields);
	if (version == 3) return;
	initFieldsNamed.call(this, ['compositeForm'], fields);
};

ImageMedia.prototype.initBeforeLoad = function  () {
	if(this.jpegBytes) {
		var str = '';
		for (var i = 0; i < this.jpegBytes.length; i++) {
			str += String.fromCharCode(this.jpegBytes[i]);
		}
		this.form.base64 = 'data:image/jpeg;base64,' + btoa(str);
	}
	if (this.form.base64) {
		this.base64 = this.form.base64;
	}
	if (this.base64) {
		this.image = newImage(this.base64);
	} else {
		this.image = null;
	}
};

ImageMedia.prototype.extent = function () {
	return this.form.extent();
};


// SoundMedia ////////////////////////////////////////////////////////
var SoundMedia;

SoundMedia.prototype = new ScratchMedia();
SoundMedia.prototype.constructor = SoundMedia;
SoundMedia.uber = ScratchMedia.prototype;

function SoundMedia() {

}

SoundMedia.prototype.initFields = function (fields, version) {
	SoundMedia.uber.initFields.call(this, fields, version);
	initFieldsNamed.call(this, ['originalSound', 'volume', 'balance'], fields);
	if (version == 1) return;
	initFieldsNamed.call(this, ['compressedSampleRate', 'compressedBitsPerSample', 'compressedData'], fields);
};


// SampledSound ////////////////////////////////////////////////////////
var SampledSound;

SampledSound.prototype = new ScratchMedia();
SampledSound.prototype.constructor = SampledSound;
SampledSound.uber = ScratchMedia.prototype;

function SampledSound() {

}

SampledSound.prototype.initFields = function (fields, version) {
	SampledSound.uber.initFields.call(this, fields, version);
	initFieldsNamed.call(this, ['envelopes', 'scaledVol', 'initialCount', 'samples', 'originalSamplingRate', 'samplesSize', 'scaledIncrement', 'scaledInitialIndex'], fields);
};


BoxMorph.prototype.initFields = function (fields, version) {
	BoxMorph.uber.initFields.call(this, fields, version);
	initFieldsNamed.call(this, ['border', 'borderColor'], fields);
};


// WatcherMorph ////////////////////////////////////////////////////////
var WatcherMorph;

WatcherMorph.prototype = new BoxMorph();
WatcherMorph.prototype.constructor = WatcherMorph;
WatcherMorph.uber = BoxMorph.prototype;

function WatcherMorph() {
	this.init();
}

WatcherMorph.prototype.init = function () {
	WatcherMorph.uber.init.call(this);
	this.edge = 4;
	this.needsUpdate = false;
};

WatcherMorph.prototype.initFields = function (fields, version) {
	WatcherMorph.uber.initFields.call(this, fields, version);
};

WatcherMorph.prototype.initBeforeLoad = function () {
	var m1 = this.children[0];
	m1.destroy();
	this.label = m1.children[1];
	this.frame = m1.children[3];
	this.add(this.label);
	this.add(this.frame);
	this.fixLayout();
	this.frame.label.VARS[10].addWatcher(this.frame.label.VARS[13], this);
};

WatcherMorph.prototype.fixLayout = function (fields, version) {
	this.label.setPosition(this.topLeft().add(new Point(5, 5)));
	this.frame.setPosition(this.topLeft().add(new Point(this.label.left + 4, 3)));
	this.frame.fixLayout();
	this.setExtent(this.frame.bottomRight().subtract(this.topLeft()).add(new Point(4, 3)));
};

WatcherMorph.prototype.setValue = function (value) {
	this.needsUpdate = false;
	var l = this.frame.label;
	value = value.toString();
	value = value.length > 30 ? (value.substr(0, 30) + '...') : value;
	if (!l.text === value) {
		return;
	}
	l.text = value;
	l.changed();
	l.drawNew();
	l.changed();
	this.fixLayout();
};

WatcherMorph.prototype.update = function () {
	if (this.needsUpdate) {
		var l = this.frame.label;
		this.setValue(l.VARS[10].evalCommand((['readVariable'])[['getVar:'].indexOf(l.VARS[11])], [l.VARS[13]]));
	}
};


// WatcherReadoutFrameMorph ////////////////////////////////////////////////////////
var WatcherReadoutFrameMorph;

WatcherReadoutFrameMorph.prototype = new BoxMorph();
WatcherReadoutFrameMorph.prototype.constructor = WatcherReadoutFrameMorph;
WatcherReadoutFrameMorph.uber = BoxMorph.prototype;

function WatcherReadoutFrameMorph() {
	this.init();
}

WatcherReadoutFrameMorph.prototype.init = function () {
	WatcherReadoutFrameMorph.uber.init.call(this);
};

WatcherReadoutFrameMorph.prototype.initFields = function (fields, version) {
	WatcherReadoutFrameMorph.uber.initFields.call(this, fields, version);
	this.border = 1;
};

WatcherReadoutFrameMorph.prototype.initBeforeLoad = function () {
	this.label = this.children[0];
	this.label.changed();
	this.label.drawNew();
	this.label.changed();
};

WatcherReadoutFrameMorph.prototype.fixLayout = function () {
	this.label.setPosition(this.topLeft().add(new Point(12, 3)));
	this.label.changed();
	this.label.drawNew();
	this.label.changed();
	this.setExtent(this.label.bottomRight().subtract(this.topLeft()).add(new Point(12, 2)));
};


// WatcherSliderMorph ////////////////////////////////////////////////////////
var WatcherSliderMorph;

WatcherSliderMorph.prototype = new SliderMorph();
WatcherSliderMorph.prototype.constructor = WatcherSliderMorph;
WatcherSliderMorph.uber = SliderMorph.prototype;

function WatcherSliderMorph() {
	this.init();
}

WatcherSliderMorph.prototype.init = function () {
	WatcherSliderMorph.uber.init.call(this);
};

var squeakColors = [new Color(255, 255, 255),
new Color(0, 0, 0),
new Color(255, 255, 255),
new Color(128, 128, 128),
new Color(255, 0, 0),
new Color(0, 255, 0),
new Color(0, 0, 255),
new Color(0, 255, 255),
new Color(255, 255, 0),
new Color(255, 0, 255),
new Color(32, 32, 32),
new Color(64, 64, 64),
new Color(96, 96, 96),
new Color(159, 159, 159),
new Color(191, 191, 191),
new Color(223, 223, 223),
new Color(8, 8, 8),
new Color(16, 16, 16),
new Color(24, 24, 24),
new Color(40, 40, 40),
new Color(48, 48, 48),
new Color(56, 56, 56),
new Color(72, 72, 72),
new Color(80, 80, 80),
new Color(88, 88, 88),
new Color(104, 104, 104),
new Color(112, 112, 112),
new Color(120, 120, 120),
new Color(135, 135, 135),
new Color(143, 143, 143),
new Color(151, 151, 151),
new Color(167, 167, 167),
new Color(175, 175, 175),
new Color(183, 183, 183),
new Color(199, 199, 199),
new Color(207, 207, 207),
new Color(215, 215, 215),
new Color(231, 231, 231),
new Color(239, 239, 239),
new Color(247, 247, 247),
new Color(0, 0, 0),
new Color(0, 51, 0),
new Color(0, 102, 0),
new Color(0, 153, 0),
new Color(0, 204, 0),
new Color(0, 255, 0),
new Color(0, 0, 51),
new Color(0, 51, 51),
new Color(0, 102, 51),
new Color(0, 153, 51),
new Color(0, 204, 51),
new Color(0, 255, 51),
new Color(0, 0, 102),
new Color(0, 51, 102),
new Color(0, 102, 102),
new Color(0, 153, 102),
new Color(0, 204, 102),
new Color(0, 255, 102),
new Color(0, 0, 153),
new Color(0, 51, 153),
new Color(0, 102, 153),
new Color(0, 153, 153),
new Color(0, 204, 153),
new Color(0, 255, 153),
new Color(0, 0, 204),
new Color(0, 51, 204),
new Color(0, 102, 204),
new Color(0, 153, 204),
new Color(0, 204, 204),
new Color(0, 255, 204),
new Color(0, 0, 255),
new Color(0, 51, 255),
new Color(0, 102, 255),
new Color(0, 153, 255),
new Color(0, 204, 255),
new Color(0, 255, 255),
new Color(51, 0, 0),
new Color(51, 51, 0),
new Color(51, 102, 0),
new Color(51, 153, 0),
new Color(51, 204, 0),
new Color(51, 255, 0),
new Color(51, 0, 51),
new Color(51, 51, 51),
new Color(51, 102, 51),
new Color(51, 153, 51)];

