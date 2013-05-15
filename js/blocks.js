(function (jsc) {
    // BOTH
    
    // OPERATORS ////////////
    jsc.Scriptable.prototype.add = function (n1, n2) {
        return jsc.castNumber(n1) + jsc.castNumber(n2);
    };
    
    // CONTROL //////////////
    jsc.Scriptable.prototype.scratchBroadcast = function (message) {
        this.stage.addBroadcastToQueue(message.toString());
    };
    
    jsc.Scriptable.prototype.stopAllScripts = function () {
        this.stage.stopAll();
    };
    
    // LOOKS ////////////////
    jsc.Scriptable.prototype.lookLike = function (c) {
        var costume;
        
        var index;
        var cast = jsc.castNumberOrNull(c);
        if (cast !== null) {
            index = (Math.round(cast) - 1).mod(this.costumes.length);
            costume = this.costumes[index];
        } else {
            var name = c.toString();
            for (var i = 0; i < this.costumes.length; i++) {
                if (this.costumes[i].name === name) {
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
    
    jsc.Scriptable.prototype.nextCostume = function () {
        this.costumeIndex = (this.costumeIndex + 1).mod(this.costumes.length);
        this.costume = this.costumes[this.costumeIndex];
    };
    
    jsc.Scriptable.prototype.getCostumeIndex = function () {
        return (this.costumeIndex).mod(this.costumes.length - 1) + 1;
    };
    
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
        return this.stage.mouse.x - this.stage.origin().x;
    };
    
    jsc.Scriptable.prototype.mouseY = function () {
        return this.stage.origin().y - this.stage.mouse.y;
    };
    jsc.Scriptable.prototype.mousePressed = function () {
        return this.stage.mouseDown;
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
            return this.stage.keys[keys[str]];
        }
        return this.stage.keys[key.toString().toUpperCase().charCodeAt(0)];
    };
    
    jsc.Scriptable.prototype.timerReset = function () {
        this.stage.timer.reset();
    };
    
    jsc.Scriptable.prototype.getTimer = function () {
        return this.stage.timer.getElapsed() / 1000;
    };
    
    jsc.Scriptable.prototype.getAttributeof = function (attribute, object) {
        var s = this.coerceSprite(object);
        if (s) {
            var a = attribute.toString();
            if (typeof s.variables[a] !== 'undefined') {
                return s.variables[a].val;
            }
            return s.getAttribute(a);
        }
        return 0;
    };

    // SOUNDS ///////////////
    jsc.Scriptable.prototype.playSound = function (sound) {
        var sound = this.getSound(sound);
        if (sound !== null) {
            sound.play(this.volume);
        }
    };
    
    jsc.Scriptable.prototype.stopAllSounds = function () {
        this.stage.stopAllSounds();
    };
    
    jsc.Scriptable.prototype.setVolumeTo = function (volume) {
        this.volume = volume;
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
        return jsc.castNumber(o1) < jsc.castNumber(o2);
    };
    
    jsc.Scriptable.prototype.equals = function (o1, o2) {
        /*if (typeof o1 === typeof o2 === 'number') {
            return o1 === o2;
        } else if (typeof o1 === typeof o2 === 'string') {
            return o1.toLowerCase() === o2.toLowerCase();
        }
        return o1.toString().toLowerCase() === o2.toString().toLowerCase();*/
        return o1 == o2;
    };
    
    jsc.Scriptable.prototype.greatorThan = function (o1, o2) {
        return jsc.castNumber(o1) > jsc.castNumber(o2);
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
        return s1.toString() + s2.toString();
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
        this.stage.penCtx.stroke();
        this.stage.penCtx.clearRect(0, 0, this.stage.penCanvas.width, this.stage.penCanvas.height);
    };
    
    // VARIABLES ////////////
    jsc.Scriptable.prototype.getVariable = function (name) {
        return this.allVariables[name].val;
    };
    
    jsc.Scriptable.prototype.changeVariable = function (name, relative, value) {
        if (relative) {
            this.allVariables[name].val = jsc.castNumber(this.allVariables[name].val) + jsc.castNumber(value);
        } else {
            this.allVariables[name].val = value;
        }
    };
    
    jsc.Scriptable.prototype.hideVariable = function (variable) {
        var children = this.stage.children;
        var child;
        for (var i = 0; i < children.length; i++) {
            child = children[i];
            if (child instanceof jsc.Watcher && child.command === 'getVariable' && child.arg === variable) {
                child.hidden = true;
            }
        }
    };
    
    jsc.Scriptable.prototype.showVariable = function (variable) {
        var children = this.stage.children;
        var child;
        for (var i = 0; i < children.length; i++) {
            child = children[i];
            if (child instanceof jsc.Watcher && child.command === 'getVariable' && child.arg === variable) {
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
        var i = Math.round(jsc.castNumber(line) - 1);
        if (i > 0) {
            if (i < list.length) {
                list.splice(i, 0, item);
            } else if (i === list.length) {
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
    
    
    
    
    // SPRITES ////////////////////////////////////////////
    
    // MOTION ///////////////
    jsc.Sprite.prototype.forward = function (dist) {
        var rad = Math.PI/180 * (this.direction + 90);
        var v = jsc.castNumber(dist);
        this.setRelativePosition(this.getRelativePosition().add(new jsc.Point(Math.sin(rad) * v, Math.cos(rad) * v)));
    };
    
    jsc.Sprite.prototype.setHeading = function (heading) {
        this.direction = (jsc.castNumber(heading)) - 90;
        this.boundingChanged = true;
    };
    
    jsc.Sprite.prototype.pointTowards = function (object) {
        var coords;
        if (object.toString() === 'mouse') {
            coords = this.stage.mouse;
        } else {
            var s = this.coerceSprite(object);
            if (!s) {
                return;
            }
            coords = s.position;
        }
        var p = this.position.subtract(coords);
        this.direction = Math.atan2(p.x, -p.y) * 180/Math.PI + 90;
        this.boundingChanged = true;
    };
    
    jsc.Sprite.prototype.turnRight = function (angle) {
        this.direction += (jsc.castNumber(angle));
        this.boundingChanged = true;
    };
    
    jsc.Sprite.prototype.turnLeft = function (angle) {
        this.direction -= (jsc.castNumber(angle));
        this.boundingChanged = true;
    };
    
    jsc.Sprite.prototype.gotoXy = function (x, y) {
        this.setRelativePosition(new jsc.Point(jsc.castNumber(x), jsc.castNumber(y)));
    };
    
    jsc.Sprite.prototype.gotoSpriteOrMouse = function (object) {
        var stage = this.stage;
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
        var sb = this.stage.bounds;
        
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
    jsc.Sprite.prototype.say = function (string) {
        console.log(string);
    };
    
    jsc.Sprite.prototype.changeSizeBy = function (delta) {
        var size = ((jsc.castNumber(delta)) / 100 + Math.max(this.scalePoint.x, this.scalePoint.y));
        this.scalePoint = new jsc.Point(size, size);
        this.boundingChanged = true;
    };
    
    jsc.Sprite.prototype.setSizeTo = function (size) {
        size = (jsc.castNumber(size)) / 100;
        this.scalePoint = new jsc.Point(size, size);
        this.boundingChanged = true;
    };
    
    jsc.Sprite.prototype.changeStretchBy = function (delta) {
        this.scalePoint.x += (jsc.castNumber(delta)) / 100;
        this.boundingChanged = true;
    };
    
    jsc.Sprite.prototype.setStretchTo = function (stretch) {
        this.scalePoint.x = (jsc.castNumber(stretch)) / 100 * this.scalePoint.y;
        this.boundingChanged = true;
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
        var children = this.stage.children;
        children.unshift(children.splice(children.indexOf(this), 1)[0]);
    };
    
    jsc.Sprite.prototype.goBackByLayers = function (layers) {
        var children = this.stage.children;
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
            coords = this.stage.mouse;
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
        this.hasMoved = false;
        
        this.penDown = true;
    };
    
    jsc.Sprite.prototype.putPenUp = function () {
        if (!this.hasMoved) {
            var ctx = this.stage.penCtx;
            ctx.fillStyle = this.pen.color.toString();
            if (this.pen.size === 1) {
                ctx.fillRect(this.position.x, this.position.y, 1, 1);
            } else {
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, this.pen.size / 2, 0, 2 * Math.PI, false);
                ctx.fill();
            }
        }
        this.hasMoved = false;
        this.penDown = false;
    };
    
    jsc.Sprite.prototype.penColor = function (color) {
        this.pen.color = color;
        this.pen.hsl = this.pen.color.getHSL();
        this.updatePen();
    };
    
    jsc.Sprite.prototype.changePenHueBy = function (delta) {
        this.pen.hsl[0] += delta / 200;
        this.updatePen();
    };
    
    jsc.Sprite.prototype.setPenHueTo = function (hue) {
        this.pen.hsl[0] = hue / 200;
        this.updatePen();
    };
    
    jsc.Sprite.prototype.changePenShadeBy = function (delta) {
        this.pen.hsl[2] += delta / 100;
        this.updatePen();
    };
    
    jsc.Sprite.prototype.setPenShadeTo = function (shade) {
        this.pen.hsl[2] = shade / 100;
        this.updatePen();
    };
    
    jsc.Sprite.prototype.changePenSizeBy = function (delta) {
        var n = Math.max(this.pen.size + jsc.castNumber(delta), 1);
        if (this.pen.size !== n) {
            this.pen.size = n;
            this.updatePen();
        }
    };
    
    jsc.Sprite.prototype.penSize = function (size) {
        var n = Math.max(jsc.castNumber(size), 1);
        if (this.pen.size !== n) {
            this.pen.size = n;
            this.updatePen();
        }
    };
    
    jsc.Sprite.prototype.stampCostume = function () {
        var h = this.hidden;
        this.hidden = false;
        var g = this.filters.ghost;
        this.filters.ghost = 0;
        this.drawOn(this.stage.penCtx);
        this.filters.ghost = g;
        this.hidden = h;
    };
}) (jsc);
