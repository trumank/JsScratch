// Player /////////////////////////////////////////////////
function Player(url, canvas) {
	this.canvas = canvas;
	this.url = url;
	
	// download the project
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	if (xhr.overrideMimeType) {
		xhr.overrideMimeType("text/plain; charset=x-user-defined");
	}
	var myself = this;
	xhr.onload = function (e) {
		myself.read(window.VBArray ? new VBArray(xhr.responseBody).toArray().reduce(function(str, charIndex) {
			return str += String.fromCharCode(charIndex);
		}, '') : xhr.responseText);
	};
	xhr.send();
}

Player.prototype.read = function (data) {
	var objectStream = new ObjectStream(new jDataView(data, undefined, undefined, false));
	this.info = objectStream.nextObject();
	this.stage = objectStream.nextObject();
	this.stage.ctx = this.canvas.getContext('2d');
	this.stage.setup();
};

Player.prototype.start = function () {

};

Player.prototype.stop = function () {

};

Player.prototype.setTurbo = function (turbo) {

};


function newCanvas(width, height) {
	var canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	return canvas;
}

function newImage(src, callback) {
	var img = new Image();
	img.loaded = false;
	img.onload = function() {
		img.loaded = true;
		callback && callback();
	};
	img.src = src;
	return img;
}

function initFieldsNamed(fields, fieldStream) {
	for (var i = 0; i < fields.length; i++) {
		if (fields[i]) {
			this[fields[i]] = fieldStream.nextField();
		}
	}
}

Number.prototype.mod = function (n) {
	return ((this % n) + n) % n;
}

//'data:image/gif;base64,R0lGODlhFAARAKIAAAAAAP///wK7AkZGRv///wAAAAAAAAAAACH5BAEAAAQALAAAAAAUABEAAAM7SKrT6yu+IUSjFkrSqv/WxmHgpzFlGjKk6g2TC8KsbD72G+freGGX2UOi6WRYImLvlBxNmk0adMOcKhIAOw==', 'data:image/gif;base64,R0lGODlhFAARAKIAAAAAAP///wD/AEZGRv///wAAAAAAAAAAACH5BAEAAAQALAAAAAAUABEAAAM7SKrT6yu+IUSjFkrSqv/WxmHgpzFlGjKk6g2TC8KsbD72G+freGGX2UOi6WRYImLvlBxNmk0adMOcKhIAOw==');
//'data:image/gif;base64,R0lGODlhEQARAKIAAAAAAP///0ZFQ8cAAP///wAAAAAAAAAAACH5BAEAAAQALAAAAAARABEAAAMvSKrSLiuyQeuAkgjL8dpc94UkBJJhg5bnWqmuBcfUTNuxSV+j602oX0+UYTwakgQAOw==', 'data:image/gif;base64,R0lGODlhEQARAKIAAAAAAP///0ZFQ+8AAP///wAAAAAAAAAAACH5BAEAAAQALAAAAAARABEAAAMvSKrSLiuyQeuAkgjL8dpc94UkBJJhg5bnWqmuBcfUTNuxSV+j602oX0+UYTwakgQAOw==');


// Scriptable ////////////////////////////////////////
function Scriptable() {
	this.init();
}

Scriptable.prototype.init = function () {
	this.threads = [];
	this.fps = 60;
};

Scriptable.prototype.initFields = function (fields, version) {
	initFieldsNamed.call(this, ['bounds', 'parent', 'children', 'color', 'flags'], fields);
	fields.nextField();
	initFieldsNamed.call(this, ['objName', 'variables', 'blocksBin', 'isClone', 'media', 'costume'], fields);
};

Scriptable.prototype.initBeforeLoad = function () {
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

Scriptable.prototype.getStage = function () {
	if (this.parent instanceof Stage) {
		return this.parent;
	} else if (this instanceof Stage) {
		return this;
	}
	return null;
};

Scriptable.prototype.stepThreads = function () {
	for (var i = 0; i < this.threads.length; i++) {
		this.threads[i].step();
	}
};

Scriptable.prototype.isRunning = function () {
	for (var i = 0; i < this.threads.length; i++) {
		if (!this.threads[i].done) {
			return true;
		}
	}
	return false;
};

Scriptable.prototype.broadcast = function (broadcast) {
	for (var i = 0; i < this.threads.length; i++) {
		if (this.threads[i].hat[0] === 'EventHatMorph' && this.threads[i].hat[1].toLowerCase() === broadcast.toLowerCase()) {
			this.threads[i].start();
		}
	}
};

Scriptable.prototype.stopAll = function () {
	for (var i = 0; i < this.threads.length; i++) {
		this.threads[i].stop();
	}
};

Scriptable.prototype.evalCommand = function (command, args) {
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

Scriptable.prototype.fixLayout = function () {
	this.needsRedraw = true;
}

Scriptable.prototype.isStage = function () {
	return false;
};

Scriptable.prototype.getVariable = function (name) {
	return this.variables.at(name) === undefined ? this.getStage().variables.at(name)[0] : this.variables.at(name)[0];
};

Scriptable.prototype.changeVariable = function (name, value, relative) {
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

Scriptable.prototype.addWatcher = function (variable, watcher) {
	if (this.variables.at(variable) instanceof Array) {
		this.variables.at(variable).push(watcher);
	} else {
		this.variables.put(variable, [this.variables.at(variable), watcher]);
	}
};

Scriptable.prototype.getList = function (name) {
	return this.lists.at(name) === undefined ? this.getStage().lists.at(name) : this.lists.at(name);
};


// Stage /////////////////////////////////////////////
var Stage;

Stage.prototype = new Scriptable();
Stage.prototype.constructor = Stage;
Stage.uber = Scriptable.prototype;

function Stage() {
	this.init();
}

Stage.prototype.init = function () {
	Stage.uber.init.call(this);
	this.turbo = false;
	this.broadcastQuene = [];
	this.timer = new Stopwatch();
};

Stage.prototype.initFields = function (fields, version) {
	Stage.uber.initFields.call(this, fields, version);
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

Stage.prototype.initBeforeLoad = function () {
	Stage.uber.initBeforeLoad.call(this);
	/*this.watchers = this.children.filter(function (m) {
		return m instanceof WatcherMorph;
	});*/
};

Stage.prototype.drawOn = function (ctx) {
	ctx.drawImage(this.costume.getImage(), 0, 0);
	
	for (var i = 0; i < this.children.length; i++) {
		this.children[i].drawOn && this.children[i].drawOn(ctx);
	}
}

Stage.prototype.setup = function () {
	this.drawOn(this.ctx);
};

Stage.prototype.step = function () {
	Stage.uber.step.call(this);
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

Stage.prototype.stepThreads = function () {
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
	Stage.uber.stepThreads.call(this);
};

Stage.prototype.isRunning = function () {
	var running = Stage.uber.isRunning.call(this);
	
	for (var i = 0; i < this.sprites.length; i++) {
		running = running || this.sprites[i].isRunning();
	}
	return running;
};

Stage.prototype.isStage = function () {
	return true;
};

Stage.prototype.evalCommand = function (command, args) {
	switch (command) {
	default:
		return Stage.uber.evalCommand.call(this, command, args);
	}
};

Stage.prototype.drawNew = function () {
	Stage.uber.drawNew.call(this);
	if (this.penCanvas) {
		var ctx = this.image.getContext('2d');
		ctx.drawImage(this.penCanvas, 0, 0);
	}
};

Stage.prototype.addBroadcastToQuene = function (broadcast) {
	this.broadcastQuene.push(broadcast);
};

Stage.prototype.stopAll = function () {
	for (var i = 0; i < this.sprites.length; i++) {
		this.sprites[i].stopAll();
	}
	Stage.uber.stopAll.call(this);
};

Stage.prototype.start = function () {
	this.addBroadcastToQuene('Scratch-StartClicked');
};

Stage.prototype.setTurbo = function (flag) {
	this.turbo = flag;
	var fps = flag ? 0 : 60;
	this.fps = fps;
};


// Sprite ////////////////////////////////////////////
var Sprite;

Sprite.prototype = new Scriptable();
Sprite.prototype.constructor = Sprite;
Sprite.uber = Scriptable.prototype;

function Sprite() {
	this.init();
}

Sprite.prototype.init = function () {
	Sprite.uber.init.call(this);
};

Sprite.prototype.initFields = function (fields, version) {
	Sprite.uber.initFields.call(this, fields, version);
	initFieldsNamed.call(this, ['visibility', 'scalePoint', 'heading', 'rotationStyle'], fields);
	if (version == 1) return;
	initFieldsNamed.call(this, ['volume', 'tempoBPM', 'draggable'], fields);
	if (version == 2) return;
	initFieldsNamed.call(this, ['sceneStates', 'lists'], fields);
};

Sprite.prototype.initBeforeLoad = function () {
	Sprite.uber.initBeforeLoad.call(this);
	
	//this.fixLayout();
	//this.moveBy(this.offset.multiplyBy(-1));
};

Sprite.prototype.drawOn = function (ctx) {
	/*
	this.extent()
	.divideBy(2)
	.add(
		rc.subtract(
			this.costume.extent()
			.divideBy(2)
		)
		.round()
		.rotateBy(radians(-(this.heading - 90).mod(360)))
	)
	.subtract(rc);
	*/
	
	
	
	var te = this.extent();
	var ce = this.costume.extent();
	var rc = this.costume.rotationCenter;
	
	var angle = (-(this.heading - 90).mod(360)) * Math.PI / 180;
	
	var x = Math.round(rc.x - (ce.x / 2));
	var y = Math.round(rc.y - (ce.y / 2));
	
	x = x * Math.cos(angle) - y * Math.sin(angle);
	y = x * Math.sin(angle) + y * Math.cos(angle);
	
	x += (te.x / 2);
	y += (te.y / 2);
	
	this.offset = new Point(x, y);
	ctx.drawImage(this.costume.getImage(), this.bounds.origin.x, this.bounds.origin.y, this.extent().x, this.extent().y);
	ctx.fillStyle = '#00FFFF';
	ctx.fillRect(this.bounds.origin.x + this.offset.x, this.bounds.origin.y + this.offset.y, 10, 10);
}

Sprite.prototype.evalCommand = function (command, args) {
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
		return Sprite.uber.evalCommand.call(this, command, args);
	}
};

Sprite.prototype.relativePosition = function () {
	//return this.topLeft().add(this.offset.add(this.costume.rotationCenter)).subtract(this.getStage().center()).multiplyBy(new Point(1, -1));
};

Sprite.prototype.setRelativePosition = function (point) {
	/*var t3 = this.costume.rotationCenter;
	var t7 = this.costume.extent().divideBy(2);
	var t8 = radians(-(this.heading - 90).mod(360));
	var t17 = this.extent();
	var t18 = t3.subtract(t7).round();//for scale: .multiplyBy(scale);
	var t19 = t17.divideBy(2).add(t18.rotateBy(t8));
	this.offset = t19.subtract(t3);
	this.setPosition(this.getStage().center().subtract(this.costume.rotationCenter.add(this.offset)).add(new Point(point.x, -point.y)));
	*/
};

Sprite.prototype.extent = function () {
	return new Point(this.bounds.corner.x - this.bounds.origin.x, this.bounds.corner.y - this.bounds.origin.y);
};


Sprite.prototype.setHeading = function (angle) {
	this.heading = ((angle + 179).mod(360) - 179);
	//this.fixLayout();
};

Sprite.prototype.drawNew = function () {
	if (!this.costume)
	{
		Scriptable.uber.drawNew.call(this);
		return;
	}
	this.image = newCanvas(this.extent());
	var ctx = this.image.getContext('2d');
	if (this.costume.image.loaded) {
		var form = this.costume.form;
		/*var r = radians(this.heading);
		var center = new Point(form.width / 2, form.height / 2);
		var offset = new Point(Math.abs(Math.sin(r)) * form.width + Math.abs(Math.cos(r)) * form.height, Math.abs(Math.cos(r)) * form.width + Math.abs(Math.sin(r)) * form.height).divideBy(2);
		ctx.save();
		ctx.translate(offset.x, offset.y);
		ctx.rotate(radians(this.heading - 90));
		ctx.translate(-center.x, -center.y);
		ctx.drawImage(this.costume.image, 0, 0);
		ctx.restore();*/
	}
};

Sprite.prototype.fixLayout = function () {
	/*Sprite.uber.fixLayout.call(this);
	var form = this.costume.form;
	var r = radians(this.heading);
	this.changed();
	this.silentSetExtent(new Point(Math.abs(Math.sin(r)) * form.width + Math.abs(Math.cos(r)) * form.height, Math.abs(Math.cos(r)) * form.width + Math.abs(Math.sin(r)) * form.height))
	var rc = this.costume.rotationCenter;
	this.offset = this.extent().divideBy(2).add(rc.subtract(this.costume.extent().divideBy(2)).round().rotateBy(radians(-(this.heading - 90).mod(360)))).subtract(rc);*/
	this.setRelativePosition(this.relativePosition());
};


// Thread /////////////////////////////////////////////////
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

	return this.object.evalCommand(selector, args);
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


// Stopwatch //////////////////////////////////////////////
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


// ScratchMedia ///////////////////////////////////////////

function ScratchMedia() {
	this.mediaName = null;
}

ScratchMedia.prototype.initFields = function (fields, version) {
	initFieldsNamed.call(this, ['mediaName'], fields);
};


// ImageMedia /////////////////////////////////////////////
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
		this.base64 = 'data:image/jpeg;base64,' + btoa(jpegBytes);
	}
	if (this.base64) {
		this.image = newImage(this.base64);
	} else {
		this.image = null;
	}
};

ImageMedia.prototype.getImage = function  () {
	if (!this.image) {
		this.image = this.form.getImage();
	}
	return this.image;
};

ImageMedia.prototype.extent = function () {
	return this.form.extent();
};

ImageMedia.prototype.center = function () {
	this.getImage();
	return new Point(this.image.width / 2, this.image.height / 2);
};


// SoundMedia /////////////////////////////////////////////
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


// SampledSound ///////////////////////////////////////////
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


/*BoxMorph.prototype.initFields = function (fields, version) {
	BoxMorph.uber.initFields.call(this, fields, version);
	initFieldsNamed.call(this, ['border', 'borderColor'], fields);
};


// WatcherMorph ///////////////////////////////////////////
function WatcherMorph() {
	this.init();
}

WatcherMorph.prototype = new BoxMorph();
WatcherMorph.prototype.constructor = WatcherMorph;
WatcherMorph.uber = BoxMorph.prototype;

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


// WatcherReadoutFrameMorph ///////////////////////////////
function WatcherReadoutFrameMorph() {
	this.init();
}

WatcherReadoutFrameMorph.prototype = new BoxMorph();
WatcherReadoutFrameMorph.prototype.constructor = WatcherReadoutFrameMorph;
WatcherReadoutFrameMorph.uber = BoxMorph.prototype;

WatcherReadoutFrameMorph.prototype.init = function () {
	WatcherReadoutFrameMorph.uber.init.call(this);
};

WatcherReadoutFrameMorph.prototype.initFields = function (fields, version) {
	//WatcherReadoutFrameMorph.uber.initFields.call(this, fields, version);
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


// WatcherSliderMorph /////////////////////////////////////
var WatcherSliderMorph;

WatcherSliderMorph.prototype = new SliderMorph();
WatcherSliderMorph.prototype.constructor = WatcherSliderMorph;
WatcherSliderMorph.uber = SliderMorph.prototype;

function WatcherSliderMorph() {
	this.init();
}

WatcherSliderMorph.prototype.init = function () {
	WatcherSliderMorph.uber.init.call(this);
};*/

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

