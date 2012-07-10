"use strict";
(function (jsc) {
	// Player /////////////////////////////////////////////////
	jsc.Player = function (url, canvas, autoplay) {
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
			if (autoplay) {
				self.start();
			}
		};
		xhr.send();
	}

	jsc.Player.prototype.read = function (data) {
		var objectStream = new jsc.ObjectStream(new jDataView(data, undefined, undefined, false));
		this.info = objectStream.nextObject();
		this.stage = objectStream.nextObject();
		this.stage.canvas = this.canvas;
		if (this.info.at('penTrails')) {
			this.stage.penCanvas = this.info.at('penTrails').getImage();
		}
		this.stage.setup();
	};

	jsc.Player.prototype.start = function () {
		this.stage.start();
	};

	jsc.Player.prototype.stop = function () {
		this.stage.stopAll();
	};

	jsc.Player.prototype.setTurbo = function (turbo) {
		this.stage.turbo = turbo;
	};
	
	jsc.Player.prototype.isTurbo = function () {
		return this.stage.turbo;
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
	
	window.addEventListener('error', function (e) {
		alert('Error:\n' + e.message + (e.lineno ? ('\nLine number: ' + e.lineno) : '') + (e.filename && e.filename !== 'undefined' ? ('\nFile: ' + e.filename) : ''));
	}, false);
	
	jsc.createPlayer = function (url, autoplay) {
		var container = document.createElement('div');
		container.setAttribute('class', 'player');
		
		var header = document.createElement('div');
		header.setAttribute('class', 'header');
		
		var title = document.createElement('span');
		title.setAttribute('class', 'title');
		title.innerHTML = 'safsdaf';
		header.appendChild(title);
		
		var stop = document.createElement('div');
		stop.setAttribute('class', 'button stop');
		header.appendChild(stop);
		
		var start = document.createElement('div');
		start.setAttribute('class', 'button start');
		header.appendChild(start);
		
		var turbo = document.createElement('input');
		turbo.setAttribute('type', 'checkbox');
		turbo.setAttribute('class', 'button');
		header.appendChild(turbo);
		
		container.appendChild(header);
		
		var canvas = document.createElement('canvas');
		canvas.setAttribute('width', '480');
		canvas.setAttribute('height', '360');
		canvas.setAttribute('tabindex', '1');
		canvas.innerHTML = 'Sorry, your browser does not support the <code>canvas</code> tag! <a href="http://www.google.com/chrome/">Get Chrome!</a>';
		container.appendChild(canvas);
		
		var player = new jsc.Player(url, canvas, autoplay);
		
		canvas.addEventListener('mousedrag', function (e) {
			e.preventDefault();
		}, false);
		
		turbo.onclick = function () {
			player.setTurbo(turbo.checked);
		};
		start.onclick = function () {
			player.start();
		};
		stop.onclick = function () {
			player.stop();
		};
		
		return [container, player];
	}

	Number.prototype.mod = function (n) {
		return ((this % n) + n) % n;
	}


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
				this.threads.push(new jsc.Thread(this, this.blocksBin[i][1]));
			}
		}

		var key;
		if (this.lists) {
			for (key in this.lists.obj) {
				this.lists.put(key, this.lists.at(key)[9]);
			}
		} else {
			this.lists = [];
		}
		
		for (key in this.variables.obj) {
			if (!(this.variables.at(key) instanceof Array)) {
				this.variables.put(key, [this.variables.at(key)]);
			}
		}
		
		this.costumes = this.media.filter(function (e) {
			return e instanceof jsc.ImageMedia;
		});
		this.sounds = this.media.filter(function (e) {
			return e instanceof jsc.SoundMedia;
		});
		
		this.costumeIndex = this.costumes.indexOf(this.costume);
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
			return this.getStage().addBroadcastToQueue(args[0].toString());
		case 'stopAll':
			return this.getStage().stopAll();

		case 'setGraphicEffect:to:':
			return;
		case 'changeGraphicEffect:by:':
			return;
		
		case 'mouseX':
			return this.getStage().mouse.x - this.getStage().origin().x;
		case 'mouseY':
			return this.getStage().origin().y - this.getStage().mouse.y;
		case 'keyPressed:':
			var keys = {
				"space": 32,
				"up arrow": 38,
				"down arrow": 40,
				"right arrow": 39,
				"left arrow": 37,
				"up": 38,
				"down": 40,
				"right": 39,
				"left": 37
			};
			var str = args[0].toString().toLowerCase();
			if (keys[str]) {
				return this.getStage().keys[keys[str]];
			}
			return this.getStage().keys[args[0].toString().toUpperCase().charCodeAt(0)];
		case 'timerReset':
			return this.getStage().timer.reset();
		case 'timer':
			return this.getStage().timer.getElapsed() / 1000;
		case 'getAttribute:of:':
			return this.coerceSprite(args[1]).getAttribute(args[0]);

		case 'playSound:':
			return;
		
		case '+':
			return (parseFloat(args[0]) || 0) + (parseFloat(args[1]) || 0);
		case '-':
			return (parseFloat(args[0]) || 0) - (parseFloat(args[1]) || 0);
		case '*':
			return (parseFloat(args[0]) || 0) * (parseFloat(args[1]) || 0);
		case '/':
			return (parseFloat(args[0]) || 0) / (parseFloat(args[1]) || 0);
		case 'randomFrom:to:':
			var n1 = parseFloat(args[0]) || 0;
			var n2 = parseFloat(args[1]) || 0;
			return Math.round(Math.random() * (n2 - n1) + n1);
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
		case '&':
			return args[0] && args[1];
		case '|':
			return args[0] || args[1];
		case 'not':
			return !args[0];
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
			return this.getStage().penCtx.clearRect(0, 0, this.getStage().penCanvas.width, this.getStage().penCanvas.height);

		case 'readVariable':
			return this.getVariable(args[0].toString());
		case 'changeVariable':
			return this.changeVariable(args[0], args[2], args[1] === 'changeVar:by:');

		case 'append:toList:':
			return this.getList(args[1].toString()).push(args[0]);
		case 'deleteLine:ofList:':
			var list = this.getList(args[1].toString());
			var i = -1;
			if (args[0] === 'last') {
				i = list.length - 1;
			} else if (args[0] === 'all') {
				return list.splice(0, list.length)
			} else {
				i = parseInt(args[0]) - 1;
			}
			if (i && i !== -1) {
				list.splice(i, 1);
			}
			return;
		case 'setLine:ofList:to:':
			var list = this.getList(args[1].toString());
			return list[this.toListLine(args[0], list)] = args[2];
		case 'getLine:ofList:':
			var list = this.getList(args[1].toString());
			return list[this.toListLine(args[0], list)];
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
	
	jsc.Scriptable.prototype.toListLine = function (arg, list) {
		var i = parseInt(arg);
		if (i) {
			if (i >= 1 && i <= list.length) {
				return i - 1;
			} else {
				return -1;
			}
		}
		
		switch (arg.toString()) {
		case 'first':
			return 0;
		case 'last':
			return list.length - 1;
		case 'any':
			return Math.floor(Math.random() * list.length);
		}
		return -1;
	};

	jsc.Scriptable.prototype.coerceSprite = function (sprite) {
		if (sprite instanceof jsc.Scriptable) {
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
		this.broadcastQueue = [];
		this.timer = new jsc.Stopwatch();
		this.keys = [];
		this.mouse = new jsc.Point(0, 0);
		for (var i = 0; i < 255; i++) {
			this.keys.push(false);
		}
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
		
		for (var i = this.sprites.length - 1; i >= 0; i--) {
			this.sprites[i].drawOn && this.sprites[i].drawOn(ctx);
		}
		
		for (var i = this.children.length - 1; i >= 0; i--) {
			this.children[i].drawOn && this.children[i].drawOn(ctx);
		}
	};

	jsc.Stage.prototype.drawAllButOn = function (ctx, sprite) {
		ctx.drawImage(this.costume.getImage(), 0, 0);
		
		ctx.drawImage(this.penCanvas, 0, 0);
		
		for (var i = this.sprites.length - 1; i >= 0; i--) {
			if (this.sprites[i] !== sprite) {
				this.sprites[i].drawOn && this.sprites[i].drawOn(ctx);
			}
		}
	};

	jsc.Stage.prototype.setup = function () {
		this.ctx = this.canvas.getContext('2d');
		if (!this.penCanvas) {
			this.penCanvas = jsc.newCanvas(this.bounds.width(), this.bounds.height())
		}
		this.penCtx = this.penCanvas.getContext('2d');
		
		this.buffer1 = jsc.newCanvas(this.width(), this.height());
		this.bufferCtx1 = this.buffer1.getContext('2d');
		
		this.buffer2 = jsc.newCanvas(this.width(), this.height());
		this.bufferCtx2 = this.buffer2.getContext('2d');
		
		var self = this;
		this.canvas.addEventListener('keydown', function (e) {
			self.keydown(e);
		}, false);
		this.canvas.addEventListener('keyup', function (e) {
			self.keyup(e);
		}, false);
		
		this.canvas.addEventListener('mousemove', function (e) {
			self.mousemove(e);
		}, false);
		
		this.step();
	};
	
	jsc.Stage.prototype.width = function () {
		return this.bounds.width();
	};
	
	jsc.Stage.prototype.height = function () {
		return this.bounds.height();
	};
	
	jsc.Stage.prototype.step = function () {
		jsc.Stage.uber.step.call(this);
		var stopwatch = new jsc.Stopwatch();
		do {
			for (var i = 0; i < this.sprites.length; i++) {
				this.sprites[i].step();
			}

			for (var i = 0; i < this.watchers.length; i++) {
				this.watchers[i].update();
			}
			
			this.drawOn(this.ctx);
		} while (stopwatch.getElapsed() < 5 && this.turbo)
		
		var self = this;
		requestAnimationFrame(function () {
			self.step();
		});
	};

	jsc.Stage.prototype.stepThreads = function () {
		for (var i = 0; i < this.broadcastQueue.length; i++) {
			this.broadcast(this.broadcastQueue[i]);
			for (var j = 0; j < this.sprites.length; j++) {
				this.sprites[j].broadcast(this.broadcastQueue[i]);
			}
		}
		this.broadcastQueue = [];
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
		case 'showBackground:':
			var costume;
			
			var index = (parseInt(args[0]) || 0) - 1;
			if (index >= 0 && index < this.costumes.length) {
				costume = this.costumes[index];
			} else {
				for (var i = 0; i < this.costumes.length; i++) {
					if (this.costumes[i].name.toLowerCase() === args[0].toLowerCase()) {
						costume = this.costumes[i];
						index = i;
					}
				}
			}
			if (costume) {
				this.costume = costume;
				this.costumeIndex = index;
			}
			return;
		default:
			return jsc.Stage.uber.evalCommand.call(this, command, args);
		}
	};

	jsc.Stage.prototype.addBroadcastToQueue = function (broadcast) {
		this.broadcastQueue.push(broadcast);
	};

	jsc.Stage.prototype.stopAll = function () {
		for (var i = 0; i < this.sprites.length; i++) {
			this.sprites[i].stopAll();
		}
		jsc.Stage.uber.stopAll.call(this);
	};

	jsc.Stage.prototype.start = function () {
		this.addBroadcastToQueue('Scratch-StartClicked');
	};

	jsc.Stage.prototype.origin = function () {
		return this.bounds.center();
	};

	jsc.Stage.prototype.toScratchCoords = function (point) {
		return point.subtract(this.bounds.center()).multiplyBy(new jsc.Point(1, -1));
	};

	jsc.Stage.prototype.fromScratchCoords = function (point) {
		return point.multiplyBy(new jsc.Point(1, -1)).add(this.bounds.center());
	};

	jsc.Stage.prototype.getSprite = function (name) {
		return this.sprites.filter(function (sprite) {
			return sprite.objName === name;
		})[0];
	};
	
	jsc.Stage.prototype.keydown = function (e) {
		e.preventDefault();
		this.keys[e.keyCode] = true;
	};
	
	jsc.Stage.prototype.keyup = function (e) {
		e.preventDefault();
		this.keys[e.keyCode] = false;
	};
	
	jsc.Stage.prototype.mousemove = function (e) {
		e.preventDefault();
		this.mouse = new jsc.Point(e.offsetX, e.offsetY);
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
		this.penColor = new jsc.Color(0, 0, 255);
	};

	jsc.Sprite.prototype.drawOn = function (ctx) {
		if (this.hidden) {
			return;
		}
		var rc = this.costume.rotationCenter;
		var angle = this.heading.mod(360) * Math.PI / 180;
		
		ctx.save();
		ctx.translate(this.position.x, this.position.y);
		if (this.rotationStyle === 'normal') {
			ctx.rotate(angle);
		}
		ctx.scale(this.rotationStyle === 'leftRight' && (this.heading - 90).mod(360) < 180 ? -this.scalePoint.x : this.scalePoint.x, this.scalePoint.y);
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
			return this.heading = (parseFloat(args[0]) || 0) - 90;
		case 'turnRight:':
			return this.heading += (parseFloat(args[0]) || 0);
		case 'turnLeft:':
			return this.heading -= (parseFloat(args[0]) || 0);
		case 'gotoX:y:':
			return this.setRelativePosition(new jsc.Point(parseFloat(args[0]) || 0, parseFloat(args[1]) || 0));
		case 'changeXposBy:':
			return this.setRelativePosition(new jsc.Point(this.getRelativePosition().x + (parseFloat(args[0]) || 0), this.getRelativePosition().y));
		case 'xpos:':
			return this.setRelativePosition(new jsc.Point(parseFloat(args[0]) || 0, this.getRelativePosition().y));
		case 'changeYposBy:':
			return this.setRelativePosition(new jsc.Point(this.getRelativePosition().x, this.getRelativePosition().y + (parseFloat(args[0]) || 0)));
		case 'bounceOffEdge':
			return;
		case 'ypos:':
			return this.setRelativePosition(new jsc.Point(this.getRelativePosition().x, parseFloat(args[0]) || 0));
		case 'xpos':
			return this.getRelativePosition().x;
		case 'ypos':
			return this.getRelativePosition().y;
		case 'heading':
			return (this.heading + 90 + 179).mod(360) - 179;

		case 'lookLike:':
			var costume;
			
			var index = (parseInt(args[0]) || 0) - 1;
			if (index >= 0 && index < this.costumes.length) {
				costume = this.costumes[index];
			} else {
				for (var i = 0; i < this.costumes.length; i++) {
					if (this.costumes[i].name.toLowerCase() === args[0].toLowerCase()) {
						costume = this.costumes[i];
						index = i;
					}
				}
			}
			if (costume) {
				this.costume = costume;
				this.costumeIndex = index;
			}
			return;
		case 'nextCostume':
			this.costumeIndex = (this.costumeIndex + 1).mod(this.costumes.length);
			return this.costume = this.costumes[this.costumeIndex];
		case 'say:':
			return console.log(args[0]);
		case 'show':
			return this.show();
		case 'hide':
			return this.hide();
		case 'comeToFront':
			var children = this.getStage().children;
			return children.unshift(children.splice(children.indexOf(this), 1)[0]);
		
		case 'touchingColor:':
			var stage = this.getStage();
			var w = stage.width();
			var h = stage.height();
			
			var bufferCtx1 = stage.bufferCtx1;
			bufferCtx1.clearRect(0, 0, w, h);
			this.drawOn(bufferCtx1);
			
			var bufferCtx2 = stage.bufferCtx2;
			bufferCtx2.clearRect(0, 0, w, h);
			stage.drawAllButOn(bufferCtx2, this);
			
			var r = args[0].r;
			var g = args[0].g;
			var b = args[0].b;
			
			var t = bufferCtx1.getImageData(0, 0, w, h).data;
			var s = bufferCtx2.getImageData(0, 0, w, h).data;
			
			var l = w * h * 4;
			
			for (var i = 0; i < l; i += 4) {
				if (t[i + 3] > 0 && s[i] === r && s[i + 1] === g && s[i + 2] === b) {
					(function(){})();
					return true;
				}
			}
			return false;
		
		case 'putPenDown':
			return this.penDown = true;
		case 'putPenUp':
			return this.penDown = false;
		case 'penColor:':
			return this.penColor = args[0];
		case 'stampCostume':
			return this.drawOn(this.getStage().penCtx);
		default:
			return jsc.Sprite.uber.evalCommand.call(this, command, args);
		}
	};

	jsc.Sprite.prototype.getRelativePosition = function () {
		return this.position.subtract(this.getStage().origin()).multiplyBy(new jsc.Point(1, -1));
	};

	jsc.Sprite.prototype.setRelativePosition = function (point) {
		if (this.penDown) {
			var ctx = this.getStage().penCtx;
			ctx.beginPath();
			ctx.strokeStyle = this.penColor.toString();
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

	jsc.Sprite.prototype.show = function () {
		this.hidden = false;
	};

	jsc.Sprite.prototype.hide = function () {
		this.hidden = true;
	};


	// jsc.Thread /////////////////////////////////////////////////
	jsc.Thread = function (object, script) {
		this.init(object, script);
	}

	jsc.Thread.prototype.init = function (object, script) {
		this.object = object;
		this.hat = script[0];
		this.wholeScript = this.script = script.slice(1, script.length);
		this.done = true;
	};

	jsc.Thread.prototype.start = function () {
		this.index = 0;
		this.stack = [];
		this.done = this.yield = false;
		this.timer = null;
		this.temp = null;
		this.script = this.wholeScript;
	};

	jsc.Thread.prototype.stop = function () {
		this.index = 0;
		this.stack = [];
		this.done = this.yield = true;
		this.timer = null;
		this.temp = null;
		this.script = this.wholeScript;
	};

	jsc.Thread.prototype.step = function () {
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

	jsc.Thread.prototype.evalCommand = function (block) {
		var selector = block[0];

		switch (selector)
		{
		case 'doIf':
			if (this.evalArg(block[1])) {
				this.evalCommandList(false, block[2]);
			}
			return;
		case 'doPlaySoundAndWait':
			return;
		case 'doBroadcastAndWait':
			var self = this;
			if (this.temp === null) {
				this.temp = this.evalArg(block[1]).toString();
				this.object.getStage().addBroadcastToQueue(this.temp);
				this.evalCommandList(true);
				return;
			}
			
			var filter = function (thread) {
				return thread.hat[0] === 'EventHatMorph' && thread.hat[1] === self.temp.toLowerCase();
			}
			
			var stage = this.object.getStage();
			var scripts = stage.threads.filter(filter);
			for (var si = 0; si < stage.sprites.length; si++) {
				scripts = scripts.concat(stage.sprites[si].threads.filter(filter));
			}
			if (scripts.filter(function (thread) {
				return thread.done;
			}).length === 0) {
				this.evalCommandList(true);
			}
			return;
		case 'doIfElse':
			this.evalCommandList(false, this.evalArg(block[1]) ? block[2] : block[3]);
			return;
		case 'doRepeat':
			if (this.temp === null) {
				this.temp = parseInt(this.evalArg(block[1])) || 0;
			}
			if (this.temp <= 0) {
				this.evalCommandList(false);
				return;
			}

			this.temp--;
			this.evalCommandList(true, block[2]);
			return;
		case 'doUntil':
			if (this.evalArg(block[1])) {
				this.evalCommandList(true, block[2]);
			}
			return;
		case 'doForever':
			this.evalCommandList(true, block[1]);
			return;
		case 'doReturn':
			this.stop();
			return;
		case 'doWaitUntil':
			if (!this.evalArg(block[1])) {
				this.evalCommandList(true);
			}
			return;
		case 'wait:elapsed:from:':
			if (!this.timer) {
				this.timer = new jsc.Stopwatch();
				this.evalCommandList(true);
			} else if (this.timer.getElapsed() < parseFloat(this.evalArg(block[1])) * 1000) {
				this.evalCommandList(true);
			}
			this.evalCommandList(false);
			return;
		case 'glideSecs:toX:y:elapsed:from:':
			if (!this.temp) {
				this.timer = new jsc.Stopwatch();
				this.temp = [this.object.position, this.object.getStage().fromScratchCoords(new jsc.Point(parseFloat(this.evalArg(block[2])) || 0, parseFloat(this.evalArg(block[3])) || 0)), parseFloat(this.evalArg(block[1]))];
			} else if (this.timer.getElapsed() < this.temp[2] * 1000) {
				this.object.position = this.temp[0].subtract(this.temp[1]).multiplyBy(this.timer.getElapsed() / -1000 / this.temp[2]).add(this.temp[0]);
			} else {
				this.object.position = this.temp[1];
				this.evalCommandList(false);
				return;
			}
			this.evalCommandList(true);
			return;
		}

		var args = [];
		for (var i = 1; i < block.length; i++) {
			args.push(this.evalArg(block[i]));
		}

		return this.object.evalCommand(selector, args);
	};

	jsc.Thread.prototype.evalArg = function (arg) {
		if (arg instanceof Array) {
			return this.evalCommand(arg);
		}
		return arg;
	};

	jsc.Thread.prototype.evalCommandList = function (repeat, commands) {
		if (repeat) {
			this.yield = true;
		} else {
			this.index++;
			this.timer = null;
			this.temp = null;
		}
		this.pushState();
		this.script = commands || [];
		this.index = -1;
		this.timer = null;
		this.temp = null;
	};

	jsc.Thread.prototype.pushState = function () {
		this.stack.push([this.script, this.index, this.timer, this.temp]);
	};

	jsc.Thread.prototype.popState = function () {
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
		this.name;
	}

	jsc.ScratchMedia.prototype.initFields = function (fields, version) {
		jsc.initFieldsNamed.call(this, ['name'], fields);
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
			var str = '';
			for (var i = 0; i < this.jpegBytes.length; i++) {
				str += String.fromCharCode(this.jpegBytes[i]);
			}
			this.base64 = 'data:image/jpeg;base64,' + btoa(str);
		}
		if (this.base64) {
			this.image = jsc.newImage(this.base64);
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