(function (jsc) {
	// BOTH
	
	// OPERATORS ////////////
	jsc.Scriptable.prototype.add = function (n1, n2) {
		return jsc.castNumber(n1) + jsc.castNumber(n2);
	};
	
	// CONTROL //////////////
	jsc.Scriptable.prototype.scratchBroadcast = function (message) {
		this.getStage().addBroadcastToQueue(message.toString());
	};
	
	jsc.Scriptable.prototype.stopAllScripts = function () {
		this.getStage().stopAll();
	};
	
	// LOOKS ////////////////
	jsc.Scriptable.prototype.changeGraphicEffectby = function (effect, delta) {
		this.filters[effect.toString()] += jsc.castNumber(delta);
	};
	
	jsc.Scriptable.prototype.setGraphicEffectto = function (effect, value) {
		this.filters[effect.toString()] = jsc.castNumber(value);
	};
	
	jsc.Scriptable.prototype.filterReset = function () {
		this.filters = {};
	};
	
	// SENSING //////////////
	jsc.Scriptable.prototype.mouseX = function () {
		return this.getStage().mouse.x - this.getStage().origin().x;
	};
	
	jsc.Scriptable.prototype.mouseY = function () {
		return this.getStage().origin().y - this.getStage().mouse.y;
	};
	jsc.Scriptable.prototype.mousePressed = function () {
		return this.getStage().mouseDown;
	};
	
	jsc.Scriptable.prototype.keyPressed = function (key) {
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
		var str = key.toString().toLowerCase();
		if (keys[str]) {
			return this.getStage().keys[keys[str]];
		}
		return this.getStage().keys[key.toString().toUpperCase().charCodeAt(0)];
	};
	
	jsc.Scriptable.prototype.timerReset = function () {
		this.getStage().timer.reset();
	};
	
	jsc.Scriptable.prototype.getTimer = function () {
		return this.getStage().timer.getElapsed() / 1000;
	};
	
	jsc.Scriptable.prototype.getAttributeof = function (object, attribute) {
		var s = this.coerceSprite(object);
		if (s) {
			var a = attribute.toString();
			if (typeof s.variables.obj[a] !== 'undefined') {
				return s.variables.obj[a];
			}
			return s.getAttribute(a);
		}
		return 0;
	};

	jsc.Scriptable.prototype.playSound = function (sound) {
		var sound = this.getSound(sound);
		if (sound !== null) {
			sound.play();
		}
	};
	
	jsc.Scriptable.prototype.stopAllSounds = function () {
		this.getStage().stopAllSounds();
	};
	
	// OPERATORS ////////////
	jsc.Scriptable.prototype.add = function (n1, n2) {
		return jsc.castNumber(n1) + jsc.castNumber(n2);
	};
	
	jsc.Scriptable.prototype.subtract = function (n1, n2) {
		return jsc.castNumber(n1) - jsc.castNumber(n2);
	};
	
	jsc.Scriptable.prototype.multiply = function (n1, n2) {
		return jsc.castNumber(n1) * jsc.castNumber(n2);
	};
	
	jsc.Scriptable.prototype.divide = function (n1, n2) {
		return jsc.castNumber(n1) / jsc.castNumber(n2);
	};
	
	jsc.Scriptable.prototype.randomFromto = function (from, to) {
		var n1 = jsc.castNumber(from);
		var n2 = jsc.castNumber(to);
		return Math.round(Math.random() * (n2 - n1) + n1);
	};
	
	jsc.Scriptable.prototype.lessThan = function (o1, o2) {
		var a = parseFloat(o1);
		var b = parseFloat(o2);
		return (isNaN(a) ? o1 : a) < (isNaN(b) ? o2 : b);
	};
	
	jsc.Scriptable.prototype.equals = function (o1, o2) {
		return o1.toString().toLowerCase() === o2.toString().toLowerCase();
	};
	
	jsc.Scriptable.prototype.greatorThan = function (o1, o2) {
		var a = parseFloat(o1);
		var b = parseFloat(o2);
		return (isNaN(a) ? o1 : a) > (isNaN(b) ? o2 : b);
	};
	
	jsc.Scriptable.prototype.and = function (b1, b2) {
		return b1 && b2;
	};
	
	jsc.Scriptable.prototype.or = function (b1, b2) {
		return b1 || b2;
	};
	
	jsc.Scriptable.prototype.not = function (b) {
		return !b;
	};
	
	jsc.Scriptable.prototype.concatenatewith = function (s1, s2) {
		return s2.toString() + s1.toString();
	};
	
	jsc.Scriptable.prototype.letterof = function (i, string) {
		return string.toString()[(jsc.castNumber(i)) - 1] || '';
	};
	
	jsc.Scriptable.prototype.stringLength = function (string) {
		return string.toString().length;
	};
	
	jsc.Scriptable.prototype.mod = function (n1, n2) {
		return jsc.castNumber(n1).mod(jsc.castNumber(n2));
	};
	
	jsc.Scriptable.prototype.rounded = function (n) {
		return Math.round(jsc.castNumber(n));
	};
	
	jsc.Scriptable.prototype.computeFunctionof = function (f, n) {
		var n = jsc.castNumber(n);
		switch (f.toString().toLowerCase()) {
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
	};

	// PEN //////////////////
	jsc.Scriptable.prototype.clearPenTrails = function () {
		this.getStage().penCtx.clearRect(0, 0, this.getStage().penCanvas.width, this.getStage().penCanvas.height);
	};
	
	// VARIABLES ////////////
	jsc.Scriptable.prototype.readVariable = function (variable) {
		return this.getVariable(variable.toString());
	};
	
	jsc.Scriptable.prototype.changeVariable = function (name, relative, value) {
		var o = this.getStage().variables;
		if (typeof o[name] === 'undefined') {
			o = this.variables;
		}
		
		if (relative) {
			o[name] = jsc.castNumber(o[name]) + jsc.castNumber(value);
		} else {
			o[name] = value;
		}
	};
	
	jsc.Scriptable.prototype.hideVariable = function (variable) {
		var children = this.getStage().children;
		var child;
		for (var i = 0; i < children.length; i++) {
			child = children[i];
			if (child instanceof jsc.Watcher && child.command === 'getMyVariable' && child.arg === variable) {
				child.hidden = true;
			}
		}
	};
	
	jsc.Scriptable.prototype.showVariable = function (variable) {
		var children = this.getStage().children;
		var child;
		for (var i = 0; i < children.length; i++) {
			child = children[i];
			if (child instanceof jsc.Watcher && child.command === 'getMyVariable' && child.arg === variable) {
				child.hidden = false;
			}
		}
	};
	
	// LISTS ////////////////
	jsc.Scriptable.prototype.contentsOfList = function (list) {
		var list = this.getList(list.toString());
		if (!list) {
			return;
		}
		
		var string = '';
		
		var space = '';
		
		for (var i = 0; i < list.length; i++) {
			if (list[i].length > 1) {
				space = ' ';
				break;
			}
		}
		
		return list.join(space);
	};
	
	jsc.Scriptable.prototype.appendtoList = function (item, list) {
		var list = this.getList(list.toString());
		if (!list) {
			return;
		}
		return list.push(item);
	};
	
	jsc.Scriptable.prototype.deleteLineofList = function (line, list) {
		var list = this.getList(list.toString());
		if (!list) {
			return;
		}
		var i = -1;
		if (line === 'last') {
			i = list.length - 1;
		} else if (line === 'all') {
			list.splice(0, list.length);
			return;
		} else {
			i = Math.round(jsc.castNumber(line)) - 1;
		}
		if (i && i !== -1) {
			list.splice(i, 1);
		}
	};
	jsc.Scriptable.prototype.insertatofList = function (item, line, list) {
		var list = this.getList(list.toString());
		if (!list) {
			return;
		}
		if (line === 'last') {
			list.push(item);
			return;
		} else if (line === 'any') {
			list.splice(Math.floor(Math.random() * list.length), 0, item);
			return;
		}
		var i = Math.round(jsc.castNumber(line));
		if (i > 0) {
			if (i < list.length - 1) {
				list.splice(i, 0, item);
			} else {
				list.push(item);
			}
		}
	};
	
	jsc.Scriptable.prototype.setLineofListto = function (line, list, item) {
		var list = this.getList(list.toString());
		if (!list) {
			return;
		}
		return list[this.toListLine(line, list)] = item;
	};
	
	jsc.Scriptable.prototype.getLineofList = function (line, list) {
		var list = this.getList(list.toString());
		if (!list) {
			return 0;
		}
		return list[this.toListLine(line, list)] || 0;
	};
	
	jsc.Scriptable.prototype.lineCountOfList = function (list) {
		var list = this.getList(list.toString());
		if (!list) {
			return 0;
		}
		return list.length;
	};
	
	jsc.Scriptable.prototype.listcontains = function (list, item) {
		var list = this.getList(list.toString());
		if (!list) {
			return false;
		}
		if (list.indexOf(item) === -1) {
			if (list.indexOf(item.toString()) === -1) {
				return false;
			}
		}
		return true;
	};
	
	
	// STAGE //////////////////////////////////////////////
	
	// LOOKS ////////////////
	jsc.Stage.prototype.showBackground = function (background) {
		var costume;
		
		var index = jsc.castNumber(background) - 1;
		if (index >= 0 && index < this.costumes.length) {
			costume = this.costumes[index];
		} else {
			for (var i = 0; i < this.costumes.length; i++) {
				if (this.costumes[i].name.toLowerCase() === background.toLowerCase()) {
					costume = this.costumes[i];
					index = i;
				}
			}
		}
		if (costume) {
			this.costume = costume;
			this.costumeIndex = index;
		};
	};
	
	jsc.Stage.prototype.nextBackground = function () {
		this.costumeIndex = (this.costumeIndex + 1).mod(this.costumes.length);
		return this.costume = this.costumes[this.costumeIndex];
	};
	
	
	// SPRITES ////////////////////////////////////////////
	
	// MOTION ///////////////
	jsc.Sprite.prototype.forward = function (dist) {
		var rad = Math.PI/180 * (this.direction + 90);
		var v = jsc.castNumber(dist);
		this.setRelativePosition(this.getRelativePosition().add(new jsc.Point(Math.sin(rad) * v, Math.cos(rad) * v)));
	};
	
	jsc.Sprite.prototype.setHeading = function (heading) {
		this.direction = (jsc.castNumber(heading)) - 90;
	};
	
	jsc.Sprite.prototype.pointTowards = function (object) {
		var coords;
		if (object.toString() === 'mouse') {
			coords = this.getStage().mouse;
		} else {
			var s = this.coerceSprite(object);
			if (!s) {
				return;
			}
			coords = s.position;
		}
		var p = this.position.subtract(coords);
		this.direction = Math.atan2(p.x, -p.y) * 180/Math.PI + 90;
	};
	
	jsc.Sprite.prototype.turnRight = function (angle) {
		this.direction += (jsc.castNumber(angle));
	};
	
	jsc.Sprite.prototype.turnLeft = function (angle) {
		this.direction -= (jsc.castNumber(angle));
	};
	
	jsc.Sprite.prototype.gotoXy = function (x, y) {
		this.setRelativePosition(new jsc.Point(jsc.castNumber(x), jsc.castNumber(y)));
	};
	
	jsc.Sprite.prototype.gotoSpriteOrMouse = function (object) {
		var stage = this.getStage();
		if (object === null) {
			return;
		}
		if (object.toString() === 'mouse') {
			this.setRelativePosition(stage.toScratchCoords(stage.mouse));
			return;
		}
		var sprite = this.coerceSprite(object);
		if (!sprite) {
			return;
		}
		this.setRelativePosition(sprite.getRelativePosition());
	};
	
	jsc.Sprite.prototype.changeXposBy = function (delta) {
		this.setRelativePosition(new jsc.Point(this.getRelativePosition().x + (jsc.castNumber(delta)), this.getRelativePosition().y));
	};
	
	jsc.Sprite.prototype.setXPos = function (x) {
		this.setRelativePosition(new jsc.Point(jsc.castNumber(x), this.getRelativePosition().y));
	};
	
	jsc.Sprite.prototype.changeYposBy = function (delta) {
		this.setRelativePosition(new jsc.Point(this.getRelativePosition().x, this.getRelativePosition().y + (jsc.castNumber(delta))));
	};
	
	jsc.Sprite.prototype.setYPos = function (y) {
		return this.setRelativePosition(new jsc.Point(this.getRelativePosition().x, jsc.castNumber(y)));
	};
	
	jsc.Sprite.prototype.bounceOffEdge = function () {
		var tb = this.getBoundingBox();
		var sb = this.getStage().bounds;
		
		tb.origin.x = Math.ceil(tb.origin.x);
		tb.origin.y = Math.ceil(tb.origin.y);
		tb.corner.x = Math.floor(tb.corner.x);
		tb.corner.y = Math.floor(tb.corner.y);
		
		if (sb.containsRectangle(tb)) {
			return;
		}
		
		var rad = Math.PI/180 * (this.direction + 90);
		var cos = Math.cos(rad);
		var sin = -Math.sin(rad);
		
		var dx = 0, dy = 0;

		if (tb.right() > sb.right()) {
			dx = sb.right() - tb.right();
			cos = -Math.abs(cos);
		}
		if (tb.bottom() > sb.bottom()) {
			dy = sb.bottom() - tb.bottom();
			sin = -cos;
		}
		if ((tb.left() + dx) < sb.left()) {
			dx = sb.left() - tb.left();
			cos = Math.abs(cos);
		}
		if ((tb.top() + dy) < sb.top()) {
			dy = sb.top() - tb.top();
			sin = -Math.abs(sin);
		}
		
		this.direction = 180/Math.PI * Math.atan2(cos, sin) - 90;
		
		this.setPosition(this.position.add(new jsc.Point(dx, dy)));
	};
	
	jsc.Sprite.prototype.getXPos = function () {
		return this.getRelativePosition().x;
	};
	
	jsc.Sprite.prototype.getYPos = function () {
		return this.getRelativePosition().y;
	};
	
	jsc.Sprite.prototype.getHeading = function () {
		return (this.direction + 90 + 179).mod(360) - 179;
	};

	// LOOKS ////////////////
	jsc.Sprite.prototype.lookLike = function (c) {
		var costume;
		
		var index;
		var cast = jsc.castNumberOrNull(c);
		if (cast !== null) {
			index = (Math.round(cast) - 1).mod(this.costumes.length);
			costume = this.costumes[index];
		} else {
			for (var i = 0; i < this.costumes.length; i++) {
				if (this.costumes[i].name === c.toString()) {
					costume = this.costumes[i];
					index = i;
				}
			}
		}
		if (costume) {
			this.costume = costume;
			this.costumeIndex = index;
		}
	};
	
	jsc.Sprite.prototype.nextCostume = function () {
		this.costumeIndex = (this.costumeIndex + 1).mod(this.costumes.length);
		this.costume = this.costumes[this.costumeIndex];
	};
	
	jsc.Sprite.prototype.getCostumeIndex = function () {
		return (this.costumeIndex).mod(this.costumes.length - 1) + 1;
	};
	
	jsc.Sprite.prototype.say = function (string) {
		console.log(string);
	};
	
	jsc.Sprite.prototype.changeSizeBy = function (delta) {
		var size = ((jsc.castNumber(delta)) / 100 + Math.max(this.scalePoint.x, this.scalePoint.y));
		this.scalePoint = new jsc.Point(size, size);
	};
	
	jsc.Sprite.prototype.setSizeTo = function (size) {
		size = (jsc.castNumber(size)) / 100;
		this.scalePoint = new jsc.Point(size, size);
	};
	
	jsc.Sprite.prototype.changeStretchBy = function (delta) {
		this.scalePoint.x += (jsc.castNumber(delta)) / 100;
	};
	
	jsc.Sprite.prototype.setStretchTo = function (stretch) {
		this.scalePoint.x = (jsc.castNumber(stretch)) / 100 * this.scalePoint.y;
	};
	
	jsc.Sprite.prototype.scale = function () {
		return Math.round(100 * this.scalePoint.x);
	};

	jsc.Sprite.prototype.show = function () {
		this.hidden = false;
	};

	jsc.Sprite.prototype.hide = function () {
		this.hidden = true;
	};
	
	jsc.Sprite.prototype.comeToFront = function () {
		var children = this.getStage().children;
		children.unshift(children.splice(children.indexOf(this), 1)[0]);
	};
	
	jsc.Sprite.prototype.goBackByLayers = function (layers) {
		var children = this.getStage().children;
		var i = children.indexOf(this);
		var layer = Math.min(i + Math.round(jsc.castNumber(layers)), children.length - 1);
		children.splice(i, 1)
		children.splice(layer, 0, this);
	};
	
	// SENSING //////////////
	jsc.Sprite.prototype.touching = function (object) {
		return this.isTouching(object);
	};
	
	jsc.Sprite.prototype.touchingColor = function (color) {
		return this.isTouchingColor(color);
	};
	
	jsc.Sprite.prototype.colorsees = function (color1, color2) {
		return this.isColorTouchingColor(color1, color2);
	};
	
	jsc.Sprite.prototype.distanceTo = function (object) {
		var coords;
		if (object.toString() === 'mouse') {
			coords = this.getStage().mouse;
		} else {
			var s = this.coerceSprite(object);
			if (!s) {
				return 10000;
			}
			coords = s.position;
		}
		return this.position.distanceTo(coords);
	};
	
	// PEN //////////////////
	jsc.Sprite.prototype.putPenDown = function () {
		var ctx = this.getStage().penCtx;
		ctx.beginPath();
		ctx.arc(this.position.x, this.position.y, this.pen.size / 2, 0, 2 * Math.PI, false);
		ctx.fillStyle = this.pen.color.toString();
		ctx.fill();
		this.penDown = true;
	};
	
	jsc.Sprite.prototype.putPenUp = function () {
		this.penDown = false;
	};
	
	jsc.Sprite.prototype.penColor = function (color) {
		this.pen.color = color;
	};
	
	jsc.Sprite.prototype.setPenHueTo = function (hue) {
		
	};
	
	jsc.Sprite.prototype.setPenShadeTo = function (shade) {
		
	};
	
	jsc.Sprite.prototype.changePenSizeBy = function (delta) {
		this.pen.size = Math.max(this.pen.size + jsc.castNumber(delta), 1);
	};
	
	jsc.Sprite.prototype.penSize = function (size) {
		this.pen.size = Math.max(jsc.castNumber(size), 0);
	};
	
	jsc.Sprite.prototype.stampCostume = function () {
		var h = this.hidden;
		this.hidden = false;
		var g = this.filters.ghost;
		this.filters.ghost = 0;
		this.drawOn(this.getStage().penCtx);
		this.filters.ghost = g;
		this.hidden = h;
	};
}) (jsc);
