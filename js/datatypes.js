// Dictionary /////////////////////////////////////////////
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


// Form ///////////////////////////////////////////////////
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

Form.prototype.getImage = function () {
	var canvas = newCanvas(this.width, this.height);
	var ctx = canvas.getContext('2d');

	if (!this.bits.isBitmap) {
		this.bits = this.decodePixels();
	}

	var data = ctx.createImageData(this.width, this.height);
	this.setImageData(data);
	ctx.putImageData(data, 0, 0);
	return canvas;
};

Form.prototype.extent = function () {
	return new Point(this.width, this.height);
};

Form.prototype.decodePixels = function () {
	var stream = new jDataView(jDataView.createBuffer(this.bits), undefined, undefined, false);
	var i = this.decodeInt(stream);
	var bitmap = [];
	var j = 0;
	while ((stream.tell() <= stream.byteLength - 1) && (j < i))
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
			var j1 = stream.getUint8();
			var k1 = (j1 * 16777216) + (j1 << 16) + (j1 << 8) + (j1);
			for (var j2 = 0; j2 < l; j2++)
				bitmap[j++] = k1;
			break;
		case 2:
			var l1 = stream.getUint32();
			for (var k2 = 0; k2 < l; k2++)
				bitmap[j++] = l1;
			break;
		case 3:
			for (var l2 = 0; l2 < l; l2++)
				bitmap[j++] = stream.getUint32();
			break;
		}
	}
	return bitmap;
}

Form.prototype.decodeInt = function (stream) {
	var i = stream.getUint8();
	if (i <= 223)
		return i;
	if (i <= 254)
		return (i - 224) * 256 + stream.getUint8();
	return stream.getUint32();
};

Form.prototype.setImageData = function (data) {
	var array = data.data;
	if (this.depth <= 8) {
		var colors = this.colors || squeakColors;
		var l = this.bits.length / this.height;
		var i1 = (1 << this.depth) - 1;
		var j1 = 32 / this.depth;
		for(var y = 0; y < this.height; y++) {
			for(var x = 0; x < this.width; x++) {
				var i2 = this.bits[y * l + (x - (x.mod(j1))) / j1];
				var j2 = this.depth * (j1 - x.mod(j1) - 1);
				var pi = (y * this.width + x) * 4;
				var ci = (i2 / Math.pow(2, j2)) & i1;
				var c = colors[ci];
				array[pi] = c.r;
				array[pi + 1] = c.g;
				array[pi + 2] = c.b;
				array[pi + 3] = c.a == 0 ? 0 : 255;
			}
		}
	}
	if (this.depth == 16) {
		var bits = [];
		var hw = Math.round((this.width) / 2);
		var index, i, j;
		for (var y = 0; y < this.height; y++) {
			i = 0;
			for (var x = 0; x < this.width; x++) {
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
	if (this.depth == 32) {
		for (var i = 0; i < array.length; i += 4) {
			var c = this.bits[i / 4];
			array[i] = (c >> 16) & 0xFF;
			array[i + 1] = (c >> 8) & 0xFF;
			array[i + 2] = c & 0xFF;
			array[i + 3] = this.depth == 16 ? (c >> 24) | 0xFF : 0xFF - ((c >> 24) | 0xFF);
		}
	}
}

// Color //////////////////////////////////////////////////
function Color(r, g, b, a) {
	this.r = r || 0;
	this.g = g || 0;
	this.b = b || 0;
	this.a = a || 255;
}

Color.prototype.toString = function () {
	return 'rgba(' + this.r >> 0 + ',' + this.g >> 0 + ',' + this.b >> 0 + ',' + this.a >> 0 + ')';
};

// Point //////////////////////////////////////////////////
function Point(x, y) {
	this.x = x || 0;
	this.y = y || 0;
}

// Rectangle //////////////////////////////////////////////
function Rectangle(left, top, right, bottom) {
	this.origin = new Point((left || 0), (top || 0));
	this.corner = new Point((right || 0), (bottom || 0));
}