"use strict";

(function (jsc) {
	// Player /////////////////////////////////////////////////
	jsc.Player = function (url, canvas) {
		this.canvas = canvas;
		this.url = url;
		
		// download the project
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		if (xhr.overrideMimeType) {
			xhr.overrideMimeType("text/plain; charset=x-user-defined");
		}
		var self = this;
		xhr.onload = function (e) {
			self.read(window.VBArray ? new VBArray(xhr.responseBody).toArray().reduce(function(str, charIndex) {
				return str += String.fromCharCode(charIndex);
			}, '') : xhr.responseText);
		};
		xhr.send();
	}

	jsc.Player.prototype.read = function (data) {
		var objectStream = new jsc.ObjectStream(new jDataView(data, undefined, undefined, false));
		this.info = objectStream.nextObject();
		this.stage = objectStream.nextObject();
		this.stage.ctx = this.canvas.getContext('2d');
		if (this.info.at('penTrails')) {
			this.stage.penCanvas = this.info.at('penTrails').getImage();
		}
		this.stage.setup();
	};

	jsc.Player.prototype.start = function () {

	};

	jsc.Player.prototype.stop = function () {

	};

	jsc.Player.prototype.setTurbo = function (turbo) {

	};


	jsc.newCanvas = function (width, height) {
		var canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		return canvas;
	}

	jsc.newImage = function (src, callback) {
		var img = new Image();
		img.loaded = false;
		img.onload = function() {
			img.loaded = true;
			callback && callback();
		};
		img.src = src;
		return img;
	}

	jsc.initFieldsNamed = function (fields, fieldStream) {
		for (var i = 0; i < fields.length; i++) {
			if (fields[i]) {
				this[fields[i]] = fieldStream.nextField();
			}
		}
	}

	window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
		setTimeout(callback, 1000 / 60);
	};

	Number.prototype.mod = function (n) {
		return ((this % n) + n) % n;
	}

	//'data:image/gif;base64,R0lGODlhFAARAKIAAAAAAP///wK7AkZGRv///wAAAAAAAAAAACH5BAEAAAQALAAAAAAUABEAAAM7SKrT6yu+IUSjFkrSqv/WxmHgpzFlGjKk6g2TC8KsbD72G+freGGX2UOi6WRYImLvlBxNmk0adMOcKhIAOw==', 'data:image/gif;base64,R0lGODlhFAARAKIAAAAAAP///wD/AEZGRv///wAAAAAAAAAAACH5BAEAAAQALAAAAAAUABEAAAM7SKrT6yu+IUSjFkrSqv/WxmHgpzFlGjKk6g2TC8KsbD72G+freGGX2UOi6WRYImLvlBxNmk0adMOcKhIAOw==');
	//'data:image/gif;base64,R0lGODlhEQARAKIAAAAAAP///0ZFQ8cAAP///wAAAAAAAAAAACH5BAEAAAQALAAAAAARABEAAAMvSKrSLiuyQeuAkgjL8dpc94UkBJJhg5bnWqmuBcfUTNuxSV+j602oX0+UYTwakgQAOw==', 'data:image/gif;base64,R0lGODlhEQARAKIAAAAAAP///0ZFQ+8AAP///wAAAAAAAAAAACH5BAEAAAQALAAAAAARABEAAAMvSKrSLiuyQeuAkgjL8dpc94UkBJJhg5bnWqmuBcfUTNuxSV+j602oX0+UYTwakgQAOw==');


	// Scriptable ////////////////////////////////////////
	jsc.Scriptable = function () {
		this.init();
	}

	jsc.Scriptable.prototype.init = function () {
		this.threads = [];
	};

	jsc.Scriptable.prototype.initFields = function (fields, version) {
		jsc.initFieldsNamed.call(this, ['bounds', 'parent', 'children', 'color', 'flags'], fields);
		fields.nextField();
		jsc.initFieldsNamed.call(this, ['objName', 'variables', 'blocksBin', 'isClone', 'media', 'costume'], fields);
	};

	jsc.Scriptable.prototype.initBeforeLoad = function () {
		for (var i = 0; i < this.blocksBin.length; i++) {
			if (['EventHatMorph', 'KeyEventHatMorph', 'MouseClickEventHatMorph'].indexOf(this.blocksBin[i][1][0][0]) != -1) {
				this.threads.push(new Thread(this, this.blocksBin[i][1]));
			}
		}

		var key;
		for (key in this.lists.obj) {
			this.lists.put(key, this.lists.at(key)[9]);
		}
		
		for (key in this.variables.obj) {
			if (!(this.variables.at(key) instanceof Array)) {
				this.variables.put(key, [this.variables.at(key)]);
			}
		}
	};

	jsc.Scriptable.prototype.getStage = function () {
		if (this.parent instanceof jsc.Stage) {
			return this.parent;
		} else if (this instanceof jsc.Stage) {
			return this;
		}
		return null;
	};

	jsc.Scriptable.prototype.step = function () {
		this.stepThreads();
	};

	jsc.Scriptable.prototype.stepThreads = function () {
		for (var i = 0; i < this.threads.length; i++) {
			this.threads[i].step();
		}
	};

	jsc.Scriptable.prototype.isRunning = function () {
		for (var i = 0; i < this.threads.length; i++) {
			if (!this.threads[i].done) {
				return true;
			}
		}
		return false;
	};

	jsc.Scriptable.prototype.broadcast = function (broadcast) {
		for (var i = 0; i < this.threads.length; i++) {
			if (this.threads[i].hat[0] === 'EventHatMorph' && this.threads[i].hat[1].toLowerCase() === broadcast.toLowerCase()) {
				this.threads[i].start();
			}
		}
	};

	jsc.Scriptable.prototype.stopAll = function () {
		for (var i = 0; i < this.threads.length; i++) {
			this.threads[i].stop();
		}
	};

	jsc.Scriptable.prototype.evalCommand = function (command, args) {
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
		case 'getAttribute:of:':
			return coerceSprite(args[1]).getAttribute(args[0]);

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
			return this.getStage().penCtx.clearRect(0, 0, canvas.width, canvas.height);

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

	jsc.Scriptable.prototype.isStage = function () {
		return false;
	};

	jsc.Scriptable.prototype.getAttribute = function () {
		return false;
	};

	jsc.Scriptable.prototype.getVariable = function (name) {
		return this.variables.at(name) === undefined ? this.getStage().variables.at(name)[0] : this.variables.at(name)[0];
	};

	jsc.Scriptable.prototype.changeVariable = function (name, value, relative) {
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

	jsc.Scriptable.prototype.addWatcher = function (variable, watcher) {
		if (this.variables.at(variable) instanceof Array) {
			this.variables.at(variable).push(watcher);
		} else {
			this.variables.put(variable, [this.variables.at(variable), watcher]);
		}
	};

	jsc.Scriptable.prototype.getList = function (name) {
		return this.lists.at(name) === undefined ? this.getStage().lists.at(name) : this.lists.at(name);
	};

	jsc.Scriptable.prototype.coerceSprite = function (sprite) {
		if (sprite instanceof Scriptable) {
			return sprite;
		}
		return this.getStage().getSprite(sprite.toString());
	};


	// jsc.Stage /////////////////////////////////////////////
	jsc.Stage = function () {
		this.init();
	}

	jsc.Stage.prototype = new jsc.Scriptable();
	jsc.Stage.prototype.constructor = jsc.Stage;
	jsc.Stage.uber = jsc.Scriptable.prototype;

	jsc.Stage.prototype.init = function () {
		jsc.Stage.uber.init.call(this);
		this.turbo = false;
		this.broadcastQuene = [];
		this.timer = new jsc.Stopwatch();
	};

	jsc.Stage.prototype.initFields = function (fields, version) {
		jsc.Stage.uber.initFields.call(this, fields, version);
		jsc.initFieldsNamed.call(this, ['zoom', 'hPan', 'vPan'], fields);
		if (version == 1) return;
		jsc.initFieldsNamed.call(this, ['obsoleteSavedState'], fields);
		if (version == 2) return;
		jsc.initFieldsNamed.call(this, ['sprites'], fields);
		if (version == 3) return;
		jsc.initFieldsNamed.call(this, ['volume', 'tempoBPM'], fields);
		if (version == 4) return;
		jsc.initFieldsNamed.call(this, ['sceneStates', 'lists'], fields);
	};

	jsc.Stage.prototype.initBeforeLoad = function () {
		jsc.Stage.uber.initBeforeLoad.call(this);
		this.watchers = [];
		/*this.watchers = this.children.filter(function (m) {
			return m instanceof WatcherMorph;
		});*/
	};

	jsc.Stage.prototype.drawOn = function (ctx) {
		ctx.drawImage(this.costume.getImage(), 0, 0);
		
		ctx.drawImage(this.penCanvas, 0, 0);
		
		for (var i = this.children.length - 1; i >= 0; i--) {
			this.children[i].drawOn && this.children[i].drawOn(ctx);
		}
	};

	jsc.Stage.prototype.setup = function () {
		if (!this.penCanvas) {
			this.penCanvas = jsc.newCanvas(this.bounds.width(), this.bounds.height())
		}
		this.penCtx = this.penCanvas.getContext('2d');
		
		this.step();
	};

	jsc.Stage.prototype.step = function () {
		jsc.Stage.uber.step.call(this);
		var stopwatch = new jsc.Stopwatch();
		//while (stopwatch.getElapsed() < 10) {
			for (var i = 0; i < this.sprites.length; i++) {
				this.sprites[i].step();
			}

			for (var i = 0; i < this.watchers.length; i++) {
				this.watchers[i].update();
			}
			
			this.drawOn(this.ctx);
		//}
		
		var self = this;
		requestAnimationFrame(function () {
			self.step();
		});
	};

	jsc.Stage.prototype.stepThreads = function () {
		for (var i = 0; i < this.broadcastQuene.length; i++) {
			this.broadcast(this.broadcastQuene[i]);
			for (var j = 0; j < this.sprites.length; j++) {
				this.sprites[j].broadcast(this.broadcastQuene[i]);
			}
		}
		this.broadcastQuene = [];
		jsc.Stage.uber.stepThreads.call(this);
	};

	jsc.Stage.prototype.isRunning = function () {
		var running = jsc.Stage.uber.isRunning.call(this);
		
		for (var i = 0; i < this.sprites.length; i++) {
			running = running || this.sprites[i].isRunning();
		}
		return running;
	};

	jsc.Stage.prototype.isStage = function () {
		return true;
	};

	jsc.Stage.prototype.evalCommand = function (command, args) {
		switch (command) {
		default:
			return jsc.Stage.uber.evalCommand.call(this, command, args);
		}
	};

	jsc.Stage.prototype.addBroadcastToQuene = function (broadcast) {
		this.broadcastQuene.push(broadcast);
	};

	jsc.Stage.prototype.stopAll = function () {
		for (var i = 0; i < this.sprites.length; i++) {
			this.sprites[i].stopAll();
		}
		Stage.uber.stopAll.call(this);
	};

	jsc.Stage.prototype.start = function () {
		this.addBroadcastToQuene('Scratch-StartClicked');
	};

	jsc.Stage.prototype.setTurbo = function (flag) {
		this.turbo = flag;
		var fps = flag ? 0 : 60;
		this.fps = fps;
	};

	jsc.Stage.prototype.origin = function () {
		return this.bounds.center();
	};

	jsc.Stage.prototype.getSprite = function (name) {
		return this.sprites.filter(function (sprite) {
			return sprite.objName === name;
		})[0];
	};


	// Sprite ////////////////////////////////////////////
	jsc.Sprite = function () {
		this.init();
	}

	jsc.Sprite.prototype = new jsc.Scriptable();
	jsc.Sprite.prototype.constructor = jsc.Sprite;
	jsc.Sprite.uber = jsc.Scriptable.prototype;


	jsc.Sprite.prototype.init = function () {
		jsc.Sprite.uber.init.call(this);
	};

	jsc.Sprite.prototype.initFields = function (fields, version) {
		jsc.Sprite.uber.initFields.call(this, fields, version);
		jsc.initFieldsNamed.call(this, ['visibility', 'scalePoint', 'heading', 'rotationStyle'], fields);
		if (version == 1) return;
		jsc.initFieldsNamed.call(this, ['volume', 'tempoBPM', 'draggable'], fields);
		if (version == 2) return;
		jsc.initFieldsNamed.call(this, ['sceneStates', 'lists'], fields);
	};

	jsc.Sprite.prototype.initBeforeLoad = function () {
		jsc.Sprite.uber.initBeforeLoad.call(this);
		this.position = this.bounds.origin.add(this.costume.rotationCenter);
		this.hidden = (this.flags & 1) === 1;
	};

	jsc.Sprite.prototype.drawOn = function (ctx) {
		if (this.hidden) {
			return;
		}
		var rc = this.costume.rotationCenter;
		var angle = this.heading.mod(360) * Math.PI / 180;
		
		ctx.save();
		ctx.translate(this.position.x, this.position.y);
		ctx.rotate(angle);
		ctx.scale(this.scalePoint.x, this.scalePoint.y);
		ctx.translate(-rc.x, -rc.y);
		ctx.drawImage(this.costume.getImage(), 0, 0);
		ctx.restore();
	}

	jsc.Sprite.prototype.evalCommand = function (command, args) {
		switch (command) {
		case 'forward:':
			var rad = Math.PI/180 * (this.heading + 90);
			var v = parseFloat(args[0]) || 0;
			return this.setRelativePosition(this.getRelativePosition().add(new jsc.Point(Math.sin(rad) * v, Math.cos(rad) * v)));
		case 'heading:':
			return this.setHeading(parseFloat(args[0]) || 0);
		case 'turnRight:':
			return this.setHeading(this.heading + (parseFloat(args[0]) || 0));
		case 'turnLeft:':
			return this.setHeading(this.heading + (parseFloat(args[0]) || 0));
		case 'gotoX:y:':
			return this.setRelativePosition(new jsc.Point(parseFloat(args[0]) || 0, parseFloat(args[1]) || 0));
		case 'changeXposBy:':
			return this.setRelativePosition(new jsc.Point(this.getRelativePosition().x + (parseFloat(args[0]) || 0), this.getRelativePosition().y));
		case 'xpos:':
			return this.setRelativePosition(new jsc.Point(parseFloat(args[0]) || 0, this.getRelativePosition().y));
		case 'changeYposBy:':
			return this.setRelativePosition(new jsc.Point(this.getRelativePosition().x, this.getRelativePosition().y + (parseFloat(args[0]) || 0)));
		case 'ypos:':
			return this.setRelativePosition(new jsc.Point(this.getRelativePosition().x, parseFloat(args[0]) || 0));
		case 'xpos':
			return this.getRelativePosition().x;
		case 'ypos':
			return this.getRelativePosition().y;
		case 'heading':
			return this.heading;

		case 'show':
			return this.show();
		case 'hide':
			return this.hide();
		
		case 'putPenDown':
			return this.penDown = true;
		case 'putPenUp':
			return this.penDown = false;
		case 'stampCostume':
			return this.drawOn(this.getStage().penCtx);
		default:
			return Sprite.uber.evalCommand.call(this, command, args);
		}
	};

	jsc.Sprite.prototype.getRelativePosition = function () {
		return this.position.subtract(this.getStage().origin()).multiplyBy(new jsc.Point(1, -1));
	};

	jsc.Sprite.prototype.setRelativePosition = function (point) {
		if (this.penDown) {
			var ctx = this.getStage().penCtx;
			ctx.beginPath();
			ctx.moveTo(this.position.x, this.position.y);
		}
		this.position = point.multiplyBy(new jsc.Point(1, -1)).add(this.getStage().origin());
		if (this.penDown) {
			ctx.lineTo(this.position.x, this.position.y);
			ctx.stroke();
		}
	};

	jsc.Sprite.prototype.extent = function () {
		return new jsc.Point(this.bounds.corner.x - this.bounds.origin.x, this.bounds.corner.y - this.bounds.origin.y);
	};


	jsc.Sprite.prototype.setHeading = function (angle) {
		this.heading = ((angle + 179).mod(360) - 179);
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
	jsc.Stopwatch = function () {
		this.init();
	}

	jsc.Stopwatch.prototype.init = function () {
		this.startTime = new Date().getTime();
	};

	jsc.Stopwatch.prototype.reset = function () {
		this.startTime = new Date().getTime();
	};

	jsc.Stopwatch.prototype.getElapsed = function () {
		return new Date().getTime() - this.startTime;
	};


	// ScratchMedia ///////////////////////////////////////////
	jsc.ScratchMedia = function () {
		this.mediaName = null;
	}

	jsc.ScratchMedia.prototype.initFields = function (fields, version) {
		jsc.initFieldsNamed.call(this, ['mediaName'], fields);
	};


	// ImageMedia /////////////////////////////////////////////
	jsc.ImageMedia = function () {

	}

	jsc.ImageMedia.prototype = new jsc.ScratchMedia();
	jsc.ImageMedia.prototype.constructor = jsc.ImageMedia;
	jsc.ImageMedia.uber = jsc.ScratchMedia.prototype;

	jsc.ImageMedia.prototype.initFields = function (fields, version) {
		jsc.ImageMedia.uber.initFields.call(this, fields, version);
		jsc.initFieldsNamed.call(this, ['form', 'rotationCenter'], fields);
		if (version == 1) return;
		jsc.initFieldsNamed.call(this, ['textBox'], fields);
		if (version == 2) return;
		jsc.initFieldsNamed.call(this, ['jpegBytes'], fields);
		if (version == 3) return;
		this.form = fields.nextField() || this.form;
	};

	jsc.ImageMedia.prototype.initBeforeLoad = function  () {
		if(this.jpegBytes) {
			this.base64 = 'data:image/jpeg;base64,' + btoa(this.jpegBytes);
		}
		if (this.base64) {
			this.image = newImage(this.base64);
		} else {
			this.image = null;
		}
	};

	jsc.ImageMedia.prototype.getImage = function  () {
		if (!this.image) {
			this.image = this.form.getImage();
		}
		return this.image;
	};

	jsc.ImageMedia.prototype.extent = function () {
		return this.form.extent();
	};

	jsc.ImageMedia.prototype.center = function () {
		this.getImage();
		return new jsc.Point(this.image.width / 2, this.image.height / 2);
	};


	// SoundMedia /////////////////////////////////////////////
	jsc.SoundMedia = function () {

	}

	jsc.SoundMedia.prototype = new jsc.ScratchMedia();
	jsc.SoundMedia.prototype.constructor = jsc.SoundMedia;
	jsc.SoundMedia.uber = jsc.ScratchMedia.prototype;

	jsc.SoundMedia.prototype.initFields = function (fields, version) {
		jsc.SoundMedia.uber.initFields.call(this, fields, version);
		jsc.initFieldsNamed.call(this, ['originalSound', 'volume', 'balance'], fields);
		if (version == 1) return;
		jsc.initFieldsNamed.call(this, ['compressedSampleRate', 'compressedBitsPerSample', 'compressedData'], fields);
	};


	// SampledSound ///////////////////////////////////////////
	jsc.SampledSound = function () {

	}

	jsc.SampledSound.prototype = new jsc.ScratchMedia();
	jsc.SampledSound.prototype.constructor = jsc.SampledSound;
	jsc.SampledSound.uber = jsc.ScratchMedia.prototype;

	jsc.SampledSound.prototype.initFields = function (fields, version) {
		jsc.SampledSound.uber.initFields.call(this, fields, version);
		jsc.initFieldsNamed.call(this, ['envelopes', 'scaledVol', 'initialCount', 'samples', 'originalSamplingRate', 'samplesSize', 'scaledIncrement', 'scaledInitialIndex'], fields);
	};


	/*BoxMorph.prototype.initFields = function (fields, version) {
		BoxMorph.uber.initFields.call(this, fields, version);
		jsc.initFieldsNamed.call(this, ['border', 'borderColor'], fields);
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
		this.label.setPosition(this.topLeft().add(new jsc.Point(5, 5)));
		this.frame.setPosition(this.topLeft().add(new jsc.Point(this.label.left + 4, 3)));
		this.frame.fixLayout();
		this.setExtent(this.frame.bottomRight().subtract(this.topLeft()).add(new jsc.Point(4, 3)));
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
		this.label.setPosition(this.topLeft().add(new jsc.Point(12, 3)));
		this.label.changed();
		this.label.drawNew();
		this.label.changed();
		this.setExtent(this.label.bottomRight().subtract(this.topLeft()).add(new jsc.Point(12, 2)));
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

	jsc.squeakColors = [new jsc.Color(255, 255, 255),
	new jsc.Color(0, 0, 0),
	new jsc.Color(255, 255, 255),
	new jsc.Color(128, 128, 128),
	new jsc.Color(255, 0, 0),
	new jsc.Color(0, 255, 0),
	new jsc.Color(0, 0, 255),
	new jsc.Color(0, 255, 255),
	new jsc.Color(255, 255, 0),
	new jsc.Color(255, 0, 255),
	new jsc.Color(32, 32, 32),
	new jsc.Color(64, 64, 64),
	new jsc.Color(96, 96, 96),
	new jsc.Color(159, 159, 159),
	new jsc.Color(191, 191, 191),
	new jsc.Color(223, 223, 223),
	new jsc.Color(8, 8, 8),
	new jsc.Color(16, 16, 16),
	new jsc.Color(24, 24, 24),
	new jsc.Color(40, 40, 40),
	new jsc.Color(48, 48, 48),
	new jsc.Color(56, 56, 56),
	new jsc.Color(72, 72, 72),
	new jsc.Color(80, 80, 80),
	new jsc.Color(88, 88, 88),
	new jsc.Color(104, 104, 104),
	new jsc.Color(112, 112, 112),
	new jsc.Color(120, 120, 120),
	new jsc.Color(135, 135, 135),
	new jsc.Color(143, 143, 143),
	new jsc.Color(151, 151, 151),
	new jsc.Color(167, 167, 167),
	new jsc.Color(175, 175, 175),
	new jsc.Color(183, 183, 183),
	new jsc.Color(199, 199, 199),
	new jsc.Color(207, 207, 207),
	new jsc.Color(215, 215, 215),
	new jsc.Color(231, 231, 231),
	new jsc.Color(239, 239, 239),
	new jsc.Color(247, 247, 247),
	new jsc.Color(0, 0, 0),
	new jsc.Color(0, 51, 0),
	new jsc.Color(0, 102, 0),
	new jsc.Color(0, 153, 0),
	new jsc.Color(0, 204, 0),
	new jsc.Color(0, 255, 0),
	new jsc.Color(0, 0, 51),
	new jsc.Color(0, 51, 51),
	new jsc.Color(0, 102, 51),
	new jsc.Color(0, 153, 51),
	new jsc.Color(0, 204, 51),
	new jsc.Color(0, 255, 51),
	new jsc.Color(0, 0, 102),
	new jsc.Color(0, 51, 102),
	new jsc.Color(0, 102, 102),
	new jsc.Color(0, 153, 102),
	new jsc.Color(0, 204, 102),
	new jsc.Color(0, 255, 102),
	new jsc.Color(0, 0, 153),
	new jsc.Color(0, 51, 153),
	new jsc.Color(0, 102, 153),
	new jsc.Color(0, 153, 153),
	new jsc.Color(0, 204, 153),
	new jsc.Color(0, 255, 153),
	new jsc.Color(0, 0, 204),
	new jsc.Color(0, 51, 204),
	new jsc.Color(0, 102, 204),
	new jsc.Color(0, 153, 204),
	new jsc.Color(0, 204, 204),
	new jsc.Color(0, 255, 204),
	new jsc.Color(0, 0, 255),
	new jsc.Color(0, 51, 255),
	new jsc.Color(0, 102, 255),
	new jsc.Color(0, 153, 255),
	new jsc.Color(0, 204, 255),
	new jsc.Color(0, 255, 255),
	new jsc.Color(51, 0, 0),
	new jsc.Color(51, 51, 0),
	new jsc.Color(51, 102, 0),
	new jsc.Color(51, 153, 0),
	new jsc.Color(51, 204, 0),
	new jsc.Color(51, 255, 0),
	new jsc.Color(51, 0, 51),
	new jsc.Color(51, 51, 51),
	new jsc.Color(51, 102, 51),
	new jsc.Color(51, 153, 51)];

	//[16777215, 0, 16777215, 8421504, 16711680, 65280, 255, 65535, 16776960, 16711935, 2105376, 4210752, 6316128, 10461087, 12566463, 14671839, 526344, 1052688, 1579032, 2631720, 3158064, 3684408, 4737096, 5263440, 5789784, 6842472, 7368816, 7895160, 8882055, 9408399, 9934743, 10987431, 11513775, 12040119, 13092807, 13619151, 14145495, 15198183, 15724527, 16250871, 0, 13056, 26112, 39168, 52224, 65280, 51, 13107, 26163, 39219, 52275, 65331, 102, 13158, 26214, 39270, 52326, 65382, 153, 13209, 26265, 39321, 52377, 65433, 204, 13260, 26316, 39372, 52428, 65484, 255, 13311, 26367, 39423, 52479, 65535, 3342336, 3355392, 3368448, 3381504, 3394560, 3407616, 3342387, 3355443, 3368499, 3381555]
}) (jsc);