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
	this.xhr.addEventListener("progress", function (e) {
		myself.onprogress(e);
	}, false);
	this.xhr.addEventListener("load", function (e) {
		myself.onload(e);
	}, false);
	this.xhr.addEventListener("error", function (e) {
		myself.onerror(e);
	}, false);
	this.xhr.addEventListener("abort", function (e) {
		myself.onabort(e);
	}, false);
	this.xhr.open("GET", url, true);
	this.xhr.responseType = "arraybuffer";
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
	menu.addItem("percent...", function () {
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
	this.keys = keys || [];
	this.values = values || [];
}

Dictionary.prototype.at = function (key) {
	var i;
	for (i = 0; i < this.keys.length; i += 1) {
		if (key === this.keys[i]) {
			return this.values[i];
		}
	}
	return null;
};

Dictionary.prototype.put = function (key, value) {
	this.keys.push(key);
	this.values.push(value);
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

Form.prototype.decodePixels = function () {
	var stream = new BinaryStream(this.bits);
	var i = this.decodeInt(stream);
	var bitmap = [];
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
		var i2 = (this.width + 1) / 2;
		for (var i3 = 0; i3 < this.height; i3++)
		{
			var i = 16;
			for (var i4 = 0; i4 < this.width; i4++)
			{
				var j = this.bits[(i3 * i2 + i4 / 2)] >> i & 0xFFFF;
				var k = (j >> 10 & 0x1F) << 3;
				var m = (j >> 5 & 0x1F) << 3;
				var n = (j & 0x1F) << 3;
				var i1 = k + m + n == 0 ? 0 : k << 16 | m << 8 | n;
				bits[(i3 * this.width + i4)] = i1;
				i = i == 16 ? 0 : 16;
			}
		}
		this.bits = bits;
	}
	if (this.depth == 32 || this.depth == 16)
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
	return this.stream.nextString(8) === "ScratchV" ? parseFloat(this.stream.nextString(2)) : -1;
};

// read the next object's header
ObjectStream.prototype.readObjectHeader = function () {
	this.temp = this.stream.index;
	return this.stream.nextString(4) === "ObjS" && this.stream.next() === 1 && this.stream.nextString(4) === "Stch" && this.stream.next() === 1;
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
	case 8:
		//Float
		return fromIEEE754Double(this.stream.nextArray(8));
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
		var arr = [],
			size = this.stream.nextUnsignedInt(4),
			i;
		for (i = 0; i < size; i += 1)
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
	var bytes = [];
	for (var i = 0; i < length; i++) {
		bytes[i] = this.next();
	}
	return bytes;
};

BinaryStream.prototype.nextString = function (length) {
	var string = "";
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
	return bytes[0] >= j ? num - j : num;
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
	this.goButton = new ButtonMorph(function () {
		alert(':D');
	}, 'data:image/gif;base64,R0lGODlhFAARAKIAAAAAAP///wK7AkZGRv///wAAAAAAAAAAACH5BAEAAAQALAAAAAAUABEAAAM7SKrT6yu+IUSjFkrSqv/WxmHgpzFlGjKk6g2TC8KsbD72G+freGGX2UOi6WRYImLvlBxNmk0adMOcKhIAOw==', 'data:image/gif;base64,R0lGODlhFAARAKIAAAAAAP///wD/AEZGRv///wAAAAAAAAAAACH5BAEAAAQALAAAAAAUABEAAAM7SKrT6yu+IUSjFkrSqv/WxmHgpzFlGjKk6g2TC8KsbD72G+freGGX2UOi6WRYImLvlBxNmk0adMOcKhIAOw==');
	this.goButton.bounds = new Rectangle(0, 0, 20, 17);
	this.stopButton = new ButtonMorph(function () {
		alert('D:');
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
	this.initFieldsNamed(['fontStyle', 'emphasis', 'text'], fields);
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
};

ScriptableMorph.prototype.initFields = function (fields, version) {
	ScriptableMorph.uber.initFields.call(this, fields, version);
	this.initFieldsNamed(['objName', 'vars', 'blocksBin', 'isClone', 'media', 'costume'], fields);
};

ScriptableMorph.prototype.initBeforeLoad = function () {
	
};

ScriptableMorph.prototype.drawNew = function () {
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
};

StageMorph.prototype.initFields = function (fields, version) {
	StageMorph.uber.initFields.call(this, fields, version);
	this.initFieldsNamed(['zoom', 'hPan', 'vPan'], fields);
	if (version == 1) return;
	this.initFieldsNamed(['obsoleteSavedState'], fields);
	if (version == 2) return;
	this.initFieldsNamed(['sprites'], fields);
	if (version == 3) return;
	this.initFieldsNamed(['volume', 'tempoBPM'], fields);
	if (version == 4) return;
	this.initFieldsNamed(['sceneStates', 'lists'], fields);
};

/*StageMorph.prototype.drawNew = function () {
	if (this.penTrails)
	if (!this.costume)
	{
		ScriptableMorph.uber.drawNew.call(this);
		return;
	}
	this.image = newCanvas(this.extent());
	var ctx = this.image.getContext('2d');
	if (this.costume.image.loaded)
		ctx.drawImage(this.costume.image, 0, 0);
};*/


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
	this.isDraggable = true;
};

SpriteMorph.prototype.initFields = function (fields, version) {
	SpriteMorph.uber.initFields.call(this, fields, version);
	this.initFieldsNamed(['visibility', 'scalePoint', 'heading', 'rotationStyle'], fields);
	if (version == 1) return;
	this.initFieldsNamed(['volume', 'tempoBPM', 'draggable'], fields);
	if (version == 2) return;
	this.initFieldsNamed(['sceneStates', 'lists'], fields);
};


// ScratchMedia ////////////////////////////////////////////////////////

function ScratchMedia() {
	this.mediaName = null;
}

ScratchMedia.prototype.initFields = function (fields, version) {
	this.initFieldsNamed(['mediaName'], fields);
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
	this.initFieldsNamed(['form', 'rotationCenter'], fields);
	//this.compositeForm = this.jpegBytes = null;
	if (version == 1) return;
	this.initFieldsNamed(['textBox'], fields);
	if (version == 2) return;
	this.initFieldsNamed(['jpegBytes'], fields);
	if (version == 3) return;
	this.initFieldsNamed(['compositeForm'], fields);
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

// SoundMedia ////////////////////////////////////////////////////////
var SoundMedia;

SoundMedia.prototype = new ScratchMedia();
SoundMedia.prototype.constructor = SoundMedia;
SoundMedia.uber = ScratchMedia.prototype;

function SoundMedia() {

}

SoundMedia.prototype.initFields = function (fields, version) {
	SoundMedia.uber.initFields.call(this, fields, version);
	this.initFieldsNamed(['originalSound', 'volume', 'balance'], fields);
	if (version == 1) return;
	this.initFieldsNamed(['compressedSampleRate', 'compressedBitsPerSample', 'compressedData'], fields);
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
	this.initFieldsNamed(['envelopes', 'scaledVol', 'initialCount', 'samples', 'originalSamplingRate', 'samplesSize', 'scaledIncrement', 'scaledInitialIndex'], fields);
};


BoxMorph.prototype.initFields = function (fields, version) {
	BoxMorph.uber.initFields.call(this, fields, version);
	this.initFieldsNamed(['border', 'borderColor'], fields);
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
};

WatcherMorph.prototype.initFields = function (fields, version) {
	WatcherMorph.uber.initFields.call(this, fields, version);
	//this.initFieldsNamed(['border', 'borderColor'], fields);
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

// Convert a JavaScript number to IEEE-754 Double Precision
// value represented as an array of 8 bytes (octets)
//
// http://cautionsingularityahead.blogspot.com/2010/04/javascript-and-ieee754-redux.html

function toIEEE754(v, ebits, fbits) {
	var bias = (1 << (ebits - 1)) - 1;
	var s, e, f;
	if (isNaN(v)) {
		e = (1 << bias) - 1;
		f = 1;
		s = 0;
	} else if (v === Infinity || v === -Infinity) {
		e = (1 << bias) - 1;
		f = 0;
		s = (v < 0) ? 1 : 0;
	} else if (v === 0) {
		e = 0;
		f = 0;
		s = (1 / v === -Infinity) ? 1 : 0;
	} else {
		s = v < 0;
		v = Math.abs(v);

		if (v >= Math.pow(2, 1 - bias)) {
			var ln = Math.min(Math.floor(Math.log(v) / Math.LN2), bias);
			e = ln + bias;
			f = v * Math.pow(2, fbits - ln) - Math.pow(2, fbits);
		} else {
			e = 0;
			f = v / Math.pow(2, 1 - bias - fbits);
		}
	}

	// Pack sign, exponent, fraction
	var i, bits = [];
	for (i = fbits; i; i -= 1) {
		bits.push(f % 2 ? 1 : 0);
		f = Math.floor(f / 2);
	}
	for (i = ebits; i; i -= 1) {
		bits.push(e % 2 ? 1 : 0);
		e = Math.floor(e / 2);
	}
	bits.push(s ? 1 : 0);
	bits.reverse();
	var str = bits.join('');

	// Bits to bytes
	var bytes = [];
	while (str.length) {
		bytes.push(parseInt(str.substring(0, 8), 2));
		str = str.substring(8);
	}
	return bytes;
}

function fromIEEE754(bytes, ebits, fbits) {

	// Bytes to bits
	var bits = [];
	for (var i = bytes.length; i; i -= 1) {
		var byte = bytes[i - 1];
		for (var j = 8; j; j -= 1) {
			bits.push(byte % 2 ? 1 : 0);
			byte = byte >> 1;
		}
	}
	bits.reverse();
	var str = bits.join('');

	// Unpack sign, exponent, fraction
	var bias = (1 << (ebits - 1)) - 1;
	var s = parseInt(str.substring(0, 1), 2) ? -1 : 1;
	var e = parseInt(str.substring(1, 1 + ebits), 2);
	var f = parseInt(str.substring(1 + ebits), 2);

	// Produce number
	if (e === (1 << ebits) - 1) {
		return f !== 0 ? NaN : s * Infinity;
	} else if (e > 0) {
		return s * Math.pow(2, e - bias) * (1 + f / Math.pow(2, fbits));
	} else if (f !== 0) {
		return s * Math.pow(2, -(bias - 1)) * (f / Math.pow(2, fbits));
	} else {
		return s * 0;
	}
}

function fromIEEE754Double(b) {
	return fromIEEE754(b, 11, 52);
}

function toIEEE754Double(v) {
	return toIEEE754(v, 11, 52);
}

function fromIEEE754Single(b) {
	return fromIEEE754(b, 8, 23);
}

function toIEEE754Single(v) {
	return toIEEE754(v, 8, 23);
}


// Convert array of octets to string binary representation
// by bartaz

function toIEEE754DoubleString(v) {
	return toIEEE754Double(v).map(function (n) {
		for (n = n.toString(2); n.length < 8; n = "0" + n);
		return n
	}).join('').replace(/(.)(.{11})(.{52})/, "$1 $2 $3")
}

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
