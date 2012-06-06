var initFieldsNamed = function (fields, fieldStream) {
	for (var i = 0; i < fields.length; i++) {
		if (fields[i]) {
			Object.defineProperty(this, fields[i], {
					value : fieldStream.nextField(),
					writable : true,  
					enumerable : true,  
					configurable : true});
		}
	}
};


Morph.prototype.initFields = function (fields, version) {
	initFieldsNamed.call(this, ['bounds', 'parent', 'children', 'color', 'flags'], fields);
	fields.nextField();
};

Morph.prototype.setBounds = function (aRect) {
	var delta = aRect.origin.subtract(this.topLeft());
	this.changed();
	this.bounds = aRect;
	this.children.forEach(function (child) {
		child.moveBy(delta);
	});
	this.drawNew();
	this.changed();
};


SliderMorph.prototype.initFields = function (fields, version) {
	initFieldsNamed.call(this, ['bounds', 'parent', null, 'color', 'flags'], fields);
	fields.nextField();
	this.orientation = 'horizontal';
};

function newImage(src, onload) {
	if (!src)
		throw ':O';
	var img = new Image();
	img.loaded = false;
	img.onload = function() {
		img.loaded = true;
		if (onload)
			onload();
	};
	img.src = src;
	return img;
}

Uint8Array.prototype.reverse = function () {
	var newArray = this.subarray(0, this.length);
	var swap;
	for (var i = 0; i < newArray.length / 2; i++) {
		swap = newArray[i];
		newArray[i] = newArray[newArray.length - i - 1];
		newArray[newArray.length - i - 1] = swap;
	}
	return newArray;
};

Number.prototype.mod = function (n) {
	return ((this % n) + n) % n;
}