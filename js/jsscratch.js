(function (jsc) {
    // Player /////////////////////////////////////////////////
    jsc.Player = function (url, canvas, autoplay, message, progress, load) {
        this.canvas = canvas;
        this.url = url;
        
        // download the project
        var xhr = new XMLHttpRequest();
        var self = this;
        xhr.onprogress = function (e) {
            progress(e.lengthComputable ? e.loaded / e.total: 1);
        };
        
        xhr.onload = function (e) {
            if (xhr.readyState === 4 && xhr.status === 200) {
                try {
                    self.read(window.VBArray ? new VBArray(xhr.responseBody).toArray().reduce(function(str, charIndex) {
                        return str += String.fromCharCode(charIndex);
                    }, '') : xhr.responseText);
                    if (autoplay) {
                        self.start();
                    }
                    load();
                } catch (e) {
                    message.innerHTML = e.message;
                }
            } else {
                message.innerHTML = xhr.status + ': ' + xhr.statusText;
            }
        };
        xhr.open('GET', url, true);
        if (xhr.overrideMimeType) {
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
        }
        try {
            xhr.send();
        } catch (e) {
            xhr.onload();
            message.innerHTML = e.message;
        }
    }

    jsc.Player.prototype.read = function (data) {
        var objectStream = new jsc.ObjectStream(new jDataView(data, undefined, undefined, false));
        this.info = objectStream.nextObject();
        this.stage = objectStream.nextObject();
        this.stage.canvas = this.canvas;
        if (this.info['penTrails']) {
            this.stage.penCanvas = this.info['penTrails'].getImage();
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


    jsc.castNumber = function (object) {
        if (typeof object === 'number') {
            return object;
        }
        var string = object.toString();
        /*if (/^(\+|\-)?[0-9]+((\.|\,)[0-9]+)*$/.test(string)) {
            return Number(string.match(/^\-?[0-9]+((\.|\,)[0-9]+)?/g)[0].replace(',', '.'));
        }*/
        
        var num = Number(string);
        
        if (num === num) {
            return num;
        }
        
        return 0;
    };
    
    jsc.castNumberOrNull = function (object) {
        if (typeof object === 'number') {
            return object;
        }
        var string = object.toString();
        if (/^(\+|\-)?[0-9]+((\.|\,)[0-9]+)*$/.test(string)) {
            return parseFloat(string.match(/^\-?[0-9]+((\.|\,)[0-9]+)?/g)[0].replace(',', '.'));
        }
        
        return null;
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
    
    jsc.createWave = function(samples, sampleRate, bitsPerSample) {
        var string = 'RIFF' + u32(36 + samples.length) + 'WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00' + u32(sampleRate) + u32(sampleRate * bitsPerSample / 8) + u16(bitsPerSample / 8) + u16(bitsPerSample) + 'data' + u32(samples.length);

        function u32(i) {
            return String.fromCharCode(i & 0xFF, (i >> 8) & 0xFF, (i >> 16) & 0xFF, (i >> 24) & 0xFF);
        }

        function u16(i) {
            return String.fromCharCode(i & 0xFF, (i >> 8) & 0xFF);
        }
        
        for (var i = 0; i < samples.length; i++) {
            string += String.fromCharCode(samples[i]);
        }
        return 'data:audio/wav;base64,' + btoa(string);
    };
    
    /*window.addEventListener('error', function (e) {
        alert('Error:\n' + e.message + (e.lineno ? ('\nLine number: ' + e.lineno) : '') + (e.filename && e.filename !== 'undefined' ? ('\nFile: ' + e.filename) : ''));
    }, false);*/
    
    if (!window.btoa) {
        window.btoa = function btoa2(str) {
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            var encoded = [];
            var c = 0;
            while (c < str.length) {
                var b0 = str.charCodeAt(c++);
                var b1 = str.charCodeAt(c++);
                var b2 = str.charCodeAt(c++);
                var buf = (b0 << 16) + ((b1 || 0) << 8) + (b2 || 0);
                var i0 = (buf & (63 << 18)) >> 18;
                var i1 = (buf & (63 << 12)) >> 12;
                var i2 = isNaN(b1) ? 64 : (buf & (63 << 6)) >> 6;
                var i3 = isNaN(b2) ? 64 : (buf & 63);
                encoded[encoded.length] = chars.charAt(i0);
                encoded[encoded.length] = chars.charAt(i1);
                encoded[encoded.length] = chars.charAt(i2);
                encoded[encoded.length] = chars.charAt(i3);
            }
            return encoded.join('');
        };
    }
    
    jsc.createPlayer = function (url, autoplay) {
        var container = document.createElement('div');
        container.setAttribute('class', 'player');

        container.addEventListener('selectstart', function (e) {
            e.preventDefault();
        });
        
        var header = document.createElement('div');
        header.setAttribute('class', 'header');
        
        var title = document.createElement('span');
        title.setAttribute('class', 'title');
        title.innerHTML = 'JsScratch';
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
        
        var subcon = document.createElement('div');
        subcon.setAttribute('class', 'subcon');
        container.appendChild(subcon);
        
        var canvas = document.createElement('canvas');
        canvas.setAttribute('width', '480');
        canvas.setAttribute('height', '360');
        canvas.setAttribute('tabindex', '1');
        canvas.innerHTML = 'Sorry, your browser does not support the <code>canvas</code> tag! <a href="http://www.google.com/chrome/">Get Chrome!</a>';
        subcon.appendChild(canvas);
        
        var progress = document.createElement('div');
        progress.setAttribute('class', 'progress');
        subcon.appendChild(progress);
        
        var bar = document.createElement('div');
        bar.setAttribute('class', 'bar');
        progress.appendChild(bar);
        
        var message = document.createElement('span');
        message.setAttribute('class', 'message');
        bar.appendChild(message);
        
        var flag = true;
        
        var player = new jsc.Player(url, canvas, autoplay, message, function (s) {
            bar.style.width = (parseFloat(getComputedStyle(progress).width) - 2) * s + 'px';
        }, function () {
            progress.addEventListener('webkitTransitionEnd', function () {
                if (flag) {
                    subcon.removeChild(progress);
                    flag = false;
                }
            }, false);
            progress.addEventListener('transitionend', function () {
                if (flag) {
                    subcon.removeChild(progress);
                    flag = false;
                }
            }, false);
            progress.className += ' fade';
            
            turbo.onclick = function () {
                player.setTurbo(turbo.checked);
            };
            start.onclick = function () {
                player.start();
            };
            stop.onclick = function () {
                player.stop();
            };
        });
        
        return [container, player];
    }

    Number.prototype.mod = function (n) {
        return ((this % n) + n) % n;
    };


    // Scriptable ////////////////////////////////////////
    jsc.Scriptable = function () {
        this.init();
    }

    jsc.Scriptable.prototype.init = function () {
        this.threads = [];
        this.filters = {};
        this.volume = 100;
    };

    jsc.Scriptable.prototype.initFields = function (fields, version) {
        jsc.initFieldsNamed.call(this, ['bounds', 'stage', 'children', 'color', 'flags'], fields);
        fields.nextField();
        jsc.initFieldsNamed.call(this, ['objName', 'variables', 'blocksBin', 'isClone', 'media', 'costume'], fields);
    };

    jsc.Scriptable.prototype.initBeforeLoad = function () {
        for (var i = 0; i < this.blocksBin.length; i++) {
            if (['EventHatMorph', 'KeyEventHatMorph', 'MouseClickEventHatMorph'].indexOf(this.blocksBin[i][1][0][0]) != -1) {
                this.threads.push(new jsc.Thread(this, this.blocksBin[i][1]));
            }
        }

        var key, list, val, num;
        if (this.lists) {
            for (key in this.lists) {
                list = this.lists[key][9];
                for (var i = 0; i < list.length; i++) {
                    val = list[i];
                    num = jsc.castNumberOrNull(val);
                    list[i] = ((num !== null && num.toString() === val) ? num : val);
                }
                this.lists[key] = list;
            }
        } else {
            this.lists = {};
        }
        
        if (this.variables) {
            for (key in this.variables) {
                variable = this.variables[key];
                
                num = jsc.castNumberOrNull(variable);
                val = ((num === null) ? variable : num);
                
                this.variables[key] = {val:val};
            }
        } else {
            this.variables = {};
        }
        
        this.costumes = this.media.filter(function (e) {
            return e instanceof jsc.ImageMedia;
        });
        this.sounds = this.media.filter(function (e) {
            return e instanceof jsc.SoundMedia;
        });
        
        this.costumeIndex = this.costumes.indexOf(this.costume);
        
        if (!this.stage) {
            this.stage = this.getStage();
        }
    };

    jsc.Scriptable.prototype.setup = function () {
        this.allVariables = {};
        
        var key;
        
        for (key in this.variables) {
            this.allVariables[key] = this.variables[key];
        }
        for (key in this.stage.variables) {
            this.allVariables[key] = this.stage.variables[key];
        }
        
        for (key in this.stage.variables) {
            this.variables[key] = this.stage.variables[key];
        }
        
        for (key in this.stage.lists) {
            this.lists[key] = this.stage.lists[key];
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
            if (this.threads[i].hat[0] === 'EventHatMorph' && this.threads[i].hat[1].toLowerCase() === broadcast.toLowerCase() && this.threads[i].done) {
                this.threads[i].start();
            }
        }
    };

    jsc.Scriptable.prototype.stopAll = function () {
        for (var i = 0; i < this.threads.length; i++) {
            this.threads[i].stop();
        }
    };

    jsc.Scriptable.prototype.getCommandFunctionName = function (selector) {
        var special = {
            "xpos:":"setXPos",
            "ypos:":"setYPos",
            "heading:":"setHeading",
            
            "showBackground:":"lookLike",
            "nextBackground":"nextCostume",
            
            "broadcast:":"scratchBroadcast",
            "stopAll":"stopAllScripts"
        };
        if (special[selector]) {
            return special[selector];
        }
        var str = selector.replace(/\:/g, '');
        if (typeof this[str] === 'function') {
            return str;
        }
        
        console.log('Unknown command block \'' + selector + '\', ignoring...');
        return null;
    };

    jsc.Scriptable.prototype.getReporterFunctionName = function (selector) {
        var special = {
            "xpos":"getXPos",
            "ypos":"getYPos",
            "heading":"getHeading",
            
            "costumeIndex":"getCostumeIndex",
            "backgroundIndex":"getCostumeIndex",
            
            "timer":"getTimer",
            
            "=":"equals",
            ">":"greatorThan",
            "<":"lessThan",
            
            "|":"or",
            "&":"and",
            
            "readVariable":"getVariable"
        };
        if (special[selector]) {
            return special[selector];
        }
        var str = selector.replace(/\:/g, '');
        if (typeof this[str] === 'function') {
            return str;
        }
        
        console.log('Unknown reporter block \'' + selector + '\', ignoring...');
        return null;
    };
    
    jsc.Scriptable.prototype.isStage = function () {
        return false;
    };

    jsc.Scriptable.prototype.getAttribute = function (attribute) {
        switch (attribute) {
        case 'volume':
            return this.volume;
        }
        return 0;
    };
    
    jsc.Scriptable.prototype.getSound = function (sound) {
        var cast = jsc.castNumberOrNull(sound);
        if (cast === null) {
            for (var i = 0; i < this.sounds.length; i++) {
                if (this.sounds[i].name.toLowerCase() === sound.toString().toLowerCase()) {
                    return this.sounds[i];
                }
            }
        } else {
            return this.sounds[(Math.round(cast) - 1).mod(this.sounds.length)];
        }
        return null;
    };

    jsc.Scriptable.prototype.getList = function (name) {
        return this.lists[name];
    };
    
    jsc.Scriptable.prototype.toListLine = function (arg, list) {
        if (typeof arg === 'string') {
            switch (arg.toString()) {
            case 'first':
                return 0;
            case 'last':
                return list.length - 1;
            case 'any':
                return Math.floor(Math.random() * list.length);
            default:
                i = jsc.castNumberOrNull(arg)
                if (i === null) {
                    return -1;
                }
                i = Math.round(i);
            }
        } else if (typeof arg === 'number') {
            i = arg;
        } else {
            return -1;
        }
        
        if (i >= 1 && i <= list.length) {
            return i - 1;
        } else {
            return -1;
        }
    };

    jsc.Scriptable.prototype.coerceSprite = function (sprite) {
        if (sprite instanceof jsc.Scriptable) {
            return sprite;
        }
        return this.stage.getSprite(sprite.toString());
    };

    jsc.Scriptable.prototype.stopAllMySounds = function () {
        for (var i = 0; i < this.sounds.length; i++) {
            this.sounds[i].stop();
        }
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
        this.mouseDown = false;
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
    };

    jsc.Stage.prototype.drawOn = function (ctx) {
        ctx.drawImage(this.costume.getImage(), 0, 0);
        
        this.penCtx.stroke();
        ctx.drawImage(this.penCanvas, 0, 0);
        this.penCtx.beginPath();
        
        for (var i = this.children.length - 1; i >= 0; i--) {
            this.children[i].drawOn && this.children[i].drawOn(ctx);
        }
    };

    jsc.Stage.prototype.drawAllButOn = function (ctx, sprite) {
        ctx.drawImage(this.costume.getImage(), 0, 0);
        
        this.penCtx.stroke();
        ctx.drawImage(this.penCanvas, 0, 0);
        this.penCtx.beginPath();
        
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
        this.penCtx.lineCap = 'round';
        
        this.buffer1 = jsc.newCanvas(this.width(), this.height());
        this.bufferCtx1 = this.buffer1.getContext('2d');
        
        this.buffer2 = jsc.newCanvas(this.width(), this.height());
        this.bufferCtx2 = this.buffer2.getContext('2d');
        
        this.allVariables = this.variables;
        
        this.canvas.onclick = function () {
            
        };
        
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
        this.canvas.addEventListener('mouseup', function (e) {
            self.mouseup(e);
        }, false);
        this.canvas.addEventListener('mousedown', function (e) {
            self.mousedown(e);
        }, false);

        this.canvas.addEventListener('touchmove', function (e) {
            self.mousemove(e);
        }, false);
        this.canvas.addEventListener('touchend', function (e) {
            self.mouseup(e);
        }, false);
        this.canvas.addEventListener('touchstart', function (e) {
            self.mousedown(e);
        }, false);
        
        for (var i = 0; i < this.sprites.length; i++) {
            this.sprites[i].setup();
        }
        
        this.eventsByName = {};
        
        var threads = this.getAllThreads();
        
        for (var i = 0; i < threads.length; i++) {
            if (threads[i].hat[0] === 'EventHatMorph') {
                var name = threads[i].hat[1].toLowerCase();
                if (!this.eventsByName[name]) {
                    this.eventsByName[name] = [];
                }
                this.eventsByName[name].push(threads[i]);
            }
        }
        
        setInterval(function () {
            self.step();
        }, 1000 / 30);
    };
    
    jsc.Stage.prototype.width = function () {
        return this.bounds.width();
    };
    
    jsc.Stage.prototype.height = function () {
        return this.bounds.height();
    };
    
    jsc.Stage.prototype.step = function () {
        var stopwatch;
        if (this.turbo) {
            stopwatch = new jsc.Stopwatch();
        }
        
        if (this.animationFrame) {
            this.addBroadcastToQueue('animationframe');
            this.animationFrame = false;
        }
        
        do {
            jsc.Stage.uber.step.call(this);
            for (var i = 0; i < this.sprites.length; i++) {
                this.sprites[i].step();
            }
        } while (this.turbo && stopwatch.getElapsed() < 30)
        
        this.ctx.clearRect(0, 0, this.bounds.width(), this.bounds.height())
        this.drawOn(this.ctx);
    };

    jsc.Stage.prototype.stepThreads = function () {
        for (var i = 0; i < this.broadcastQueue.length; i++) {
            if (this.broadcastQueue[i] === 'requestanimationframe') {
                this.animationFrame = true;
            }
            var events = this.eventsByName[this.broadcastQueue[i]];
            if (events) {
                for (var j = 0; j < events.length; j++) {
                    if (events[j].done) {
                        events[j].start();
                    }
                }
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

    jsc.Stage.prototype.getAllThreads = function () {
        if (this.allThreads) {
            return this.allThreads;
        }
        var threads = this.threads;
        for (var i = 0; i < this.sprites.length; i++) {
            threads = threads.concat(this.sprites[i].threads);
        }
        return this.allThreads = threads;
    };

    jsc.Stage.prototype.addBroadcastToQueue = function (broadcast) {
        this.broadcastQueue.push(broadcast.toLowerCase());
    };

    jsc.Stage.prototype.stopAll = function () {
        jsc.Stage.uber.stopAll.call(this);
        for (var i = 0; i < this.sprites.length; i++) {
            this.sprites[i].stopAll();
        }
        this.stopAllSounds();
    };

    jsc.Stage.prototype.start = function () {
        this.stopAll();
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
    
    jsc.Stage.prototype.getAttribute = function (attribute) {
        switch (attribute) {
        case 'background #':
            return this.costumeIndex + 1;
        }
        return jsc.Stage.uber.getAttribute.call(attribute);
    };
    
    jsc.Stage.prototype.keydown = function (e) {
        e.preventDefault();
        this.keys[e.keyCode] = true;
        var threads = this.getAllThreads();
        var thread;
        for (var i = 0; i < threads.length; i++) {
            thread = threads[i];
            if (thread.done && thread.hat[0] === 'KeyEventHatMorph' && thread.hat[1] === e.keyCode) {
                thread.start();
            }
        }
    };
    
    jsc.Stage.prototype.keyup = function (e) {
        e.preventDefault();
        this.keys[e.keyCode] = false;
    };
    
    jsc.Stage.prototype.mousemove = function (e) {
        e.preventDefault();
        var bounds = this.canvas.getBoundingClientRect();
        this.mouse = new jsc.Point((e.offsetX || e.layerX) * this.canvas.width / bounds.width, (e.offsetY || e.layerY) * this.canvas.height / bounds.height);
    };
    jsc.Stage.prototype.mouseup = function (e) {
        e.preventDefault();
        this.mouseDown = false;
    };
    jsc.Stage.prototype.mousedown = function (e) {
        e.preventDefault();
        this.mouseDown = true;
        
        for (var i = 0; i < this.children.length; i++) {
            var sprite = this.children[i];
            if (sprite instanceof jsc.Sprite && sprite.isTouching('mouse') && sprite.filters.ghost < 100) {
                var threads = sprite.threads
                for (var j = 0; j < threads.length; j++) {
                    if (threads[j].hat[0] === 'MouseClickEventHatMorph') {
                        threads[j].start();
                    }
                }
                break;
            }
        }
    };

    jsc.Stage.prototype.stopAllSounds = function () {
        jsc.Stage.uber.stopAllMySounds.call(this);
        for (var i = 0; i < this.sprites.length; i++) {
            this.sprites[i].stopAllMySounds();
        }
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
        jsc.initFieldsNamed.call(this, ['visibility', 'scalePoint', 'direction', 'rotationStyle'], fields);
        if (version == 1) return;
        jsc.initFieldsNamed.call(this, ['volume', 'tempoBPM', 'draggable'], fields);
        if (version == 2) return;
        jsc.initFieldsNamed.call(this, ['sceneStates', 'lists'], fields);
    };

    jsc.Sprite.prototype.initBeforeLoad = function () {
        jsc.Sprite.uber.initBeforeLoad.call(this);
        this.position = this.bounds.origin.add(this.costume.rotationCenter);
        this.hidden = (this.flags & 1) === 1;
        this.pen = {};
        this.pen.color = new jsc.Color(0, 0, 255);
        this.pen.hsl = this.pen.color.getHSL();
        this.pen.size = 1;
        this.boundingChanged = true;
    };
    
    jsc.Sprite.prototype.step = function () {
        this.stage.penCtx.moveTo(this.position.x - 0.5, this.position.y - 0.5);
        jsc.Sprite.uber.step.call(this);
    };

    jsc.Sprite.prototype.drawOn = function (ctx, debug) {
        if (this.hidden) {
            return;
        }
        var rc = this.costume.rotationCenter;
        var angle = this.direction.mod(360) * Math.PI / 180;
        
        ctx.save();
        ctx.translate(Math.round(this.position.x), Math.round(this.position.y));
        if (this.rotationStyle === 'normal') {
            ctx.rotate(angle);
        }
        ctx.scale(this.rotationStyle === 'leftRight' && (this.direction - 90).mod(360) < 180 ? -this.scalePoint.x : this.scalePoint.x, this.scalePoint.y);
        ctx.translate(-rc.x, -rc.y);
        var t = this.filters.ghost;
        if (typeof t !== 'undefined') {
            ctx.globalAlpha = Math.max(Math.min(1 - t / 100, 1), 0);
        }
        
        ctx.drawImage(this.costume.getImage(), 0, 0);
        
        ctx.globalAlpha = 1;
        if (debug) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#FF0000';
            ctx.strokeRect(0, 0, this.costume.extent().x, this.costume.extent().y);
        }
        
        ctx.restore();
        
        if (debug) {
            ctx.strokeStyle = '#00FF00';
            var b = this.getBoundingBox();
            ctx.strokeRect(b.left(), b.top(), b.width(), b.height());
        }
    }
    
    jsc.Sprite.prototype.getBoundingBox = function () {
        if (!this.boundingChanged) {
            return this.boundingBox;
        }
        this.boundingChanged = false;
        var p = this.position;
        var rc = this.costume.rotationCenter;
        
        var xp1 = -rc.x;
        var yp1 = -rc.y;
        
        var xp2 = this.costume.extent().x - rc.x;
        var yp2 = this.costume.extent().y - rc.y;
        
        if (this.rotationStyle !== 'normal' || this.scratchHeading() === 90) {
            return this.boundingBox = new jsc.Rectangle(xp1, yp1, xp2, yp2).scaleBy(this.scalePoint.multiplyBy(new jsc.Point(this.rotationStyle === 'leftRight' && (this.direction - 90).mod(360) < 180 ? -1 : 1, 1))).translateBy(this.position).expandBy(1);
        }
        
        var rad = Math.PI/180 * (this.direction);
        
        var cos = Math.cos(rad);
        var sin = Math.sin(rad);
        
        var x1 = xp1 * cos - yp1 * sin;
        var y1 = xp1 * sin + yp1 * cos;
     
        var x2 = xp1 * cos - yp2 * sin;
        var y2 = xp1 * sin + yp2 * cos;
     
        var x3 = xp2 * cos - yp2 * sin;
        var y3 = xp2 * sin + yp2 * cos;
     
        var x4 = xp2 * cos - yp1 * sin;
        var y4 = xp2 * sin + yp1 * cos;         
     
        var rx1 = Math.floor(p.x + Math.min(x1, x2, x3, x4) * this.scalePoint.x);
        var ry1 = Math.floor(p.y + Math.min(y1, y2, y3, y4) * this.scalePoint.y);
     
        var rx2 = Math.ceil(p.x + Math.max(x1, x2, x3, x4) * this.scalePoint.x);
        var ry2 = Math.ceil(p.y + Math.max(y1, y2, y3, y4) * this.scalePoint.y);
        
        return this.boundingBox = new jsc.Rectangle(rx1, ry1, rx2, ry2);
    };
    
    jsc.Sprite.prototype.isTouching = function (obj) {
        var stage = this.stage;
        if (obj === 'edge') {
            return !stage.bounds.containsRectangle(this.getBoundingBox().expandBy(-2).translateBy(1));
        }
        if (this.hidden) {
            return false;
        }
        
        var w = stage.width();
        var h = stage.height();
        
        var b1 = this.getBoundingBox();
        
        if (obj === 'mouse') {
            if (!b1.containsPoint(stage.mouse)) {
                return false;
            }
            
            var rc = this.costume.rotationCenter;
            var angle = this.direction.mod(360) * Math.PI / 180;

            var p = this.stage.mouse;

            p = p.translateBy(new jsc.Point(-Math.round(this.position.x), -Math.round(this.position.y)));

            p = p.scaleBy(new jsc.Point(1 / (this.rotationStyle === 'leftRight' && (this.direction - 90).mod(360) < 180 ? -this.scalePoint.x : this.scalePoint.x), 1 / this.scalePoint.y));
            
            if (this.rotationStyle === 'normal') {
                p = p.rotateBy(-angle);
            }
            
            p = p.translateBy(new jsc.Point(rc.x - 1, rc.y - 1));

            return this.costume.getImage().getContext('2d').getImageData(p.x, p.y, 1, 1).data[3] > 0;
        } else {
            var other = this.coerceSprite(obj);
            if (!other || other.hidden) {
                return false;
            }
            
            var b2 = other.getBoundingBox();
            
            if (!b1.intersects(b2)) {
                return false;
            }
            
            var bufferCtx1 = stage.bufferCtx1;
            bufferCtx1.clearRect(0, 0, w, h);
            var g = this.filters.ghost || 0;
            this.filters.ghost = 0;
            this.drawOn(bufferCtx1);
            this.filters.ghost = g;
            
            var bufferCtx2 = stage.bufferCtx2;
            bufferCtx2.clearRect(0, 0, w, h);
            g = other.filters.ghost || 0;
            other.filters.ghost = 0;
            other.drawOn(bufferCtx2);
            other.filters.ghost = g;
            
            var b = b1.intersect(b2);
            
            if (b.width() <= 0 || b.height() <= 0) {
                return false;
            }
            
            var t = bufferCtx1.getImageData(b.origin.x, b.origin.y, b.width(), b.height()).data;
            var s = bufferCtx2.getImageData(b.origin.x, b.origin.y, b.width(), b.height()).data;
            for (var i = 0; i < s.length; i += 4) {
                if (t[i + 3] > 0 && s[i + 3] > 0) {
                    return true;
                }
            }
        }
        return false;
    };
    
    jsc.Sprite.prototype.isTouchingColor = function (color) {
        var stage = this.stage;
        var w = stage.width();
        var h = stage.height();
        
        var bufferCtx1 = stage.bufferCtx1;
        bufferCtx1.clearRect(0, 0, w, h);
        this.drawOn(bufferCtx1);
        
        var bufferCtx2 = stage.bufferCtx2;
        bufferCtx2.clearRect(0, 0, w, h);
        stage.drawAllButOn(bufferCtx2, this);
        
        var b = this.getBoundingBox();
        
        var t = bufferCtx1.getImageData(b.origin.x, b.origin.y, b.width(), b.height()).data;
        var s = bufferCtx2.getImageData(b.origin.x, b.origin.y, b.width(), b.height()).data;
        
        var r = color.r;
        var g = color.g;
        var b = color.b;
        
        for (var i = 0; i < s.length; i += 4) {
            if (t[i + 3] > 0 && s[i] === r && s[i + 1] === g && s[i + 2] === b) {
                return true;
            }
        }
        return false;
    };
    
    jsc.Sprite.prototype.isColorTouchingColor = function (color1, color2) {
        var stage = this.stage;
        var w = stage.width();
        var h = stage.height();
        
        var bufferCtx1 = stage.bufferCtx1;
        bufferCtx1.clearRect(0, 0, w, h);
        this.drawOn(bufferCtx1);
        
        var bufferCtx2 = stage.bufferCtx2;
        bufferCtx2.clearRect(0, 0, w, h);
        stage.drawAllButOn(bufferCtx2, this);
        
        var b = this.getBoundingBox();
        
        var t = bufferCtx1.getImageData(b.origin.x, b.origin.y, b.width(), b.height()).data;
        var s = bufferCtx2.getImageData(b.origin.x, b.origin.y, b.width(), b.height()).data;
        
        var r1 = color1.r;
        var g1 = color1.g;
        var b1 = color1.b;
        
        var r2 = color2.r;
        var g2 = color2.g;
        var b2 = color2.b;
        
        var cs = color1.toString();
        
        var cc = this.costume.colorCache[cs];
        
        if (!cc) {
            cc = this.costume.colorCache[cs] = [];
            var f = false;
            for (var i = 0; i < s.length; i += 4) {
                if (t[i] === r1 && t[i + 1] === g1 && t[i + 2] === b1 && t[i + 3] > 0) {
                    cc.push(i);
                    if (s[i] === r2 && s[i + 1] === g2 && s[i + 2] === b2 && s[i + 3] > 0) {
                        f = true;
                    }
                }
            }
            return f;
        }
        
        var i;
        for (var j = 0; j < cc.length; j++) {
            i = cc[j];
            if (s[i] === r2 && s[i + 1] === g2 && s[i + 2] === b2 && s[i + 3] > 0) {
                return true;
            }
        }
        return false;
    };
    
    jsc.Sprite.prototype.getRelativePosition = function () {
        return this.position.subtract(this.stage.origin()).multiplyBy(new jsc.Point(1, -1));
    };

    jsc.Sprite.prototype.setRelativePosition = function (point) {
        this.setPosition(point.multiplyBy(new jsc.Point(1, -1)).add(this.stage.origin()));
    };

    jsc.Sprite.prototype.setPosition = function (point) {
        var ctx = this.stage.penCtx;
        this.position = point;
        if (this.penDown) {
            ctx.lineTo(this.position.x - 0.5, this.position.y - 0.5);
        } else {
            ctx.moveTo(this.position.x - 0.5, this.position.y - 0.5);
        }
        
        this.boundingChanged = this.hasMoved = true;
    };

    jsc.Sprite.prototype.extent = function () {
        return new jsc.Point(this.bounds.corner.x - this.bounds.origin.x, this.bounds.corner.y - this.bounds.origin.y);
    };
    
    jsc.Sprite.prototype.getAttribute = function (attribute) {
        var stage = this.stage;
        switch (attribute) {
        case 'x position':
            return stage.toScratchCoords(this.position).x;
        case 'y position':
            return stage.toScratchCoords(this.position).y;
        case 'direction':
            return this.scratchHeading();
        case 'costume #':
            return this.costumeIndex + 1;
        case 'size':
            return Math.round(this.scalePoint.x * 100);
        }
        return jsc.Sprite.uber.getAttribute.call(attribute);
    };
    
    jsc.Sprite.prototype.scratchHeading = function () {
        return (this.direction + 90 + 179).mod(360) - 179;
    };
    
    jsc.Sprite.prototype.updatePen = function () {
        var penCtx = this.stage.penCtx;
        
        penCtx.stroke();
        
        penCtx.lineWidth = this.pen.size;
        var hsl = this.pen.hsl;
        penCtx.strokeStyle = 'hsl(' + (hsl[0] * 360) + ', ' + (hsl[1] * 100) + '%, ' + (hsl[2] * 100) + '%)';
        
        penCtx.beginPath();
        penCtx.moveTo(this.position.x - 0.5, this.position.y - 0.5);
    };
    
    
    // Watcher ////////////////////////////////////////////
    jsc.Watcher = function () {
        this.init();
    }
    
    jsc.Watcher.prototype.constructor = jsc.Watcher;
    
    jsc.Watcher.prototype.init = function () {
        this.hidden = false;
    };
    
    jsc.Watcher.prototype.initFields = function (fields) {
        this.fields = fields;
    };
    
    jsc.Watcher.prototype.initBeforeLoad = function () {
        jsc.initFieldsNamed.call(this, ['bounds', 'parent'], this.fields);
        this.mode = 0;
        if (this.fields.fields[19]) {
            this.mode = 1;
        }
        if (this.fields.fields[16] !== null) {
            this.mode = 2;
        }
        this.sliderMin = this.fields.fields[20];
        this.sliderMax = this.fields.fields[21];
        
        this.color = this.fields.fields[15][3];
        
        this.label = this.fields.fields[13][8];
        
        this.object = this.fields.fields[14][10];
        
        this.command = this.commandLookup[this.fields.fields[14][11]];
        this.arg = this.fields.fields[14][13];
        
        this.value = 'watcher';
    };
    
    jsc.Watcher.prototype.commandLookup = {
        "getVar:":"getVariable",
        "timer":"getTimer"
    };
    
    jsc.Watcher.prototype.updateValue = function () {
        this.value = this.object[this.command](this.arg);
        if (typeof this.value === 'number') {
            this.value = (Math.round(this.value * 1000) / 1000).toString();
        }
    };
    
    jsc.Watcher.prototype.drawOn = function (ctx) {
        if (this.hidden) {
            return;
        }
        this.updateValue();
        ctx.font = 'bold 8pt Verdana';
        var w = ctx.measureText(this.label).width + 30;
        
        ctx.font = '8pt Verdana';
        w += Math.max(ctx.measureText(this.value).width, 30);
        
        this.bounds.corner.x = this.bounds.origin.x + w;
        
        
        var x1 = this.bounds.origin.x + 0.5;
        var y1 = this.bounds.origin.y + 0.5;
        var x2 = this.bounds.corner.x + 0.5;
        var y2 = this.bounds.corner.y + 0.5;
        
        var th = 21;
        
        var r = 7;
        
        this.drawRoundedRect(ctx, x1, y1, x2, y2, r);
        ctx.fillStyle = 'rgba(193, 196, 199, 255)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(148, 145, 145, 255)';
        ctx.stroke();
        
        x1 += 5;
        
        ctx.fillStyle = 'black';
        ctx.font = 'bold 8pt Verdana';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, x1, y1 + th / 2);
        
        x1 += ctx.measureText(this.label).width + 5;
        
        r = 4;
        
        this.drawRoundedRect(ctx, x1, y1 + 2, x2 - 4, y1 + th - 2, r);
        ctx.fillStyle = this.color.toString();
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.stroke();
        
        ctx.fillStyle = 'white';
        ctx.font = '8pt Verdana';
        w = ctx.measureText(this.value).width;
        ctx.fillText(this.value, x1 + ((x2 - x1 - 4) / 2 - (w / 2)), y1 + th / 2);
    };
    
    jsc.Watcher.prototype.drawRoundedRect = function (ctx, x1, y1, x2, y2, r) {
        ctx.beginPath();
        ctx.moveTo(x1 + r, y1);
        ctx.arcTo(x2, y1, x2, y2, r);
        ctx.lineTo(x2, y2 - r);
        ctx.arcTo(x2, y2, x1, y2, r);
        ctx.lineTo(x1 + r, y2);
        ctx.arcTo(x1, y2, x1, y1, r);
        ctx.lineTo(x1, y1 + r);
        ctx.arcTo(x1, y1, x2, y1, r);
        ctx.closePath();
    };
    
    
    // Thread /////////////////////////////////////////////////
    jsc.Thread = function (object, script) {
        this.init(object, script);
    }

    jsc.Thread.prototype.init = function (object, script) {
        this.object = object;
        this.hat = script[0];
        if (this.hat[0] === 'KeyEventHatMorph') {
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
            this.hat[1] = keys[this.hat[1]] || this.hat[1].toUpperCase().charCodeAt(0);
        }
        this.colors = [];
        this.wholeScript = this.script = this.compile(script.slice(1, script.length));
        this.done = true;
    };

    jsc.Thread.prototype.eval = function (script) {
        var self = this.object;
        var colors = this.colors;
        var c = jsc.castNumber;
        return eval(script);
    };
    
    jsc.Thread.prototype.compile = function (script) {
        if (script === null) {
            return null;
        }
        var self = this.object;
        var compiled = [];
        var string = null;
        var selector;
        for (var i = 0; i < script.length; i++) {
            selector = script[i][0];
            if (this.specialBlocks.indexOf(selector) !== -1) {
                if (string !== null) {
                    compiled.push(this.eval(string + '})'));
                }
                string = null;
                compiled.push(this.compileSpecial(script[i]));
                continue;
            } else if (string === null) {
                string = '(function(){';
            }
            
            var special = this.compileSpecialCommand(script[i]);
            if (special !== null) {
                string += special;
            } else {
                var command = this.object.getCommandFunctionName(selector);
                
                if (command === null) {
                    continue;
                }
                
                string += 'self.' + command + '(';
                for (var j = 1; j < script[i].length; j++) {
                    string += this.compileArg(script[i][j]);
                    if (j !== script[i].length - 1) {
                        string += ',';
                    }
                }
                string += ');';
            }
        }
        if (string !== null) {
            compiled.push(this.eval(string + '})'));
        }
        return compiled;
    };
    
    jsc.Thread.prototype.compileSpecialCommand = function (command) {
        switch (command[0]) {
        case 'changeVariable':
            return 'self.changeVariable(' + this.compileArg(command[1]) + ',' + ((command[2] === 'changeVar:by:') ? 'true' : 'false') + ',' + this.compileArg(command[3], true) + ');';
        case 'comment:':
            return '';
        case 'readVariable':
            return 'self.allVariables[' + this.compileArg(command[1]) + '].val;';
        }
        return null;
    };
    
    jsc.Thread.prototype.compileArg = function (arg, preferNumber) {
        if (typeof arg === 'number') {
            return arg;
        }
        if (typeof arg === 'string') {
            /*if (preferNumber) {
                var num = jsc.castNumberOrNull(arg);
                if (num !== null) {
                    return arg;
                }
            }*/
            return '\'' + this.escapeString(arg) + '\'';
        }
        if (arg instanceof jsc.Sprite) {
            return '\'' + arg.objName + '\'';
        }
        if (arg instanceof jsc.Stage) {
            return 'self.stage';
        }
        if (arg instanceof jsc.Color) {
            //return 'new jsc.Color(' + arg.r + ',' + arg.g + ',' + arg.b + ',' + arg.a + ')';
            this.colors.push(arg);
            return 'colors[' + (this.colors.length - 1) + ']';
        }
        if (!(arg instanceof Array)) {
            return arg;
        }
        
        var special = this.compileSpecialArg(arg);
        if (special !== null) {
            return special;
        }
        
        var reporter = this.object.getReporterFunctionName(arg[0]);
        
        if (reporter === null) {
            return '0';
        }
        
        var string = 'self.' + reporter + '(';
        for (var i = 1; i < arg.length; i++) {
            string += this.compileArg(arg[i]);
            if (i !== arg.length - 1) {
                string += ',';
            }
        }
        return string + ')';
    };
    
    jsc.Thread.prototype.compileSpecialArg = function (arg) {
        switch (arg[0]) {
        case '+':
            return '(c(' + this.compileArg(arg[1]) + ') + c(' + this.compileArg(arg[2]) + '))';
        case '-':
            return '(c(' + this.compileArg(arg[1]) + ') - c(' + this.compileArg(arg[2]) + '))';
        case '*':
            return '(c(' + this.compileArg(arg[1]) + ') * c(' + this.compileArg(arg[2]) + '))';
        case '/':
            return '(c(' + this.compileArg(arg[1]) + ') / c(' + this.compileArg(arg[2]) + '))';
            
        case '\\\\':
            return '(c(' + this.compileArg(arg[1]) + ').mod(c(' + this.compileArg(arg[2]) + ')))';
            
        case 'abs':
            return 'Math.abs(' + this.compileArg(arg[1], true) + ')';
            
        case 'computeFunction:of:':
            var f = arg[1];
            var v = this.compileArg(arg[2], true);
            
            switch (f.toString().toLowerCase()) {
            case 'abs':
                return 'Math.abs(' + v + ')';
            case 'sqrt':
                return 'Math.sqrt(' + v + ')';
            case 'sin':
                return 'Math.sin(Math.PI/180*' + v + ')';
            case 'cos':
                return 'Math.cos(Math.PI/180*' + v + ')';
            case 'tan':
                return 'Math.tan(Math.PI/180*' + v + ')';
            case 'asin':
                return '180/Math.PI*Math.asin(Math.max(-1,Math.min(1,' + v + ')))';
            case 'acos':
                return '180/Math.PI*Math.acos(Math.max(-1,Math.min(1,' + v + ')))';
            case 'atan':
                return '180/Math.PI*Math.atan(' + v + ')';
            case 'ln':
                return 'Math.log(' + v + ')';
            case 'log':
                return 'Math.log(' + v + ')';
            case 'e ^':
                return 'Math.pow(Math.E,' + v + ')';
            case '10 ^':
                return 'Math.pow(10,' + v + ')';
            }
        
        case 'answer':
            return 'this.stage.answer';
        }
        return null;
    };
    
    jsc.Thread.prototype.escapeString = function (string) {
        return string.replace(/\\/g, '\\\\').
            replace(/\u0008/g, '\\b').
            replace(/\t/g, '\\t').
            replace(/\n/g, '\\n').
            replace(/\f/g, '\\f').
            replace(/\r/g, '\\r').
            replace(/'/g, '\\\'').
            replace(/"/g, '\\"');
    };
    
    jsc.Thread.prototype.compileReporter = function (predicate) {
        var self = this.object;
        return this.eval('(function(){return ' + this.compileArg(predicate) + '})');
    };
    
    jsc.Thread.prototype.specialBlocks = ['doIf', 'doPlaySoundAndWait', 'doBroadcastAndWait', 'doIfElse', 'doRepeat', 'doUntil', 'doForever', 'doForeverIf', 'doReturn', 'doWaitUntil', 'wait:elapsed:from:', 'glideSecs:toX:y:elapsed:from:', 'doAsk'];
    
    jsc.Thread.prototype.compileSpecial = function (special) {
        var compiled;
        switch (special[0]) {
        case 'wait:elapsed:from:':
            compiled = [this.compileReporter(special[1])];
            break;
        case 'doForever':
            compiled = [this.compile(special[1])];
            break;
        case 'doIf':
            compiled = [this.compileReporter(special[1]), this.compile(special[2])];
            break;
        case 'doIfElse':
            compiled = [this.compileReporter(special[1]), this.compile(special[2]), this.compile(special[3])];
            break;
        case 'doUntil':
            compiled = [this.compileReporter(special[1]), this.compile(special[2])];
            break;
        case 'doRepeat':
            compiled = [this.compileReporter(special[1]), this.compile(special[2])];
            break;
        case 'doWaitUntil':
            compiled = [this.compileReporter(special[1])];
            break;
        case 'doBroadcastAndWait':
            compiled = [this.compileReporter(special[1])];
            break;
        case 'doForeverIf':
            compiled = [this.compileReporter(special[1]), this.compile(special[2])];
            break;
        case 'doReturn':
            compiled = [];
            break;
        case 'doPlaySoundAndWait':
            compiled = [this.compileReporter(special[1])];
            break;
        case 'glideSecs:toX:y:elapsed:from:':
            compiled = [this.compileReporter(special[1]), this.compileReporter(special[2]), this.compileReporter(special[3])];
            break;
        case 'doAsk':
            
        }
        return [this.specialBlocks.indexOf(special[0])].concat(compiled);
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
        if (typeof block === 'function') {
            block();
            return;
        }

        this[block[0]](block);
    };
    
    jsc.Thread.prototype[0] = function (block) {
        if (block[1]()) {
            this.evalCommandList(false, block[2]);
        }
    };
    
    jsc.Thread.prototype[1] = function (block) {
        if (this.temp === null) {
            this.temp = this.object.getSound(block[1]());
            this.temp.play(this.object.volume);
            this.evalCommandList(true);
            return;
        }
        if (this.temp.playing) {
            this.evalCommandList(true);
        } else {
            this.reset();
        }
    };
    
    jsc.Thread.prototype[2] = function (block) {
        var self = this;
        if (this.temp === null) {
            this.temp = block[1]().toString().toLowerCase();
            this.object.stage.addBroadcastToQueue(this.temp);
            this.evalCommandList(true);
            return;
        }
        
        var threads = this.object.stage.eventsByName[this.temp];
        
        if (threads) {
            for (var i = 0; i < threads.length; i++) {
                if (!threads[i].done) {
                    this.evalCommandList(true);
                    return;
                }
            }
        }
        
        this.reset();
    };
    
    jsc.Thread.prototype[3] = function (block) {
        this.evalCommandList(false, block[1]() ? block[2] : block[3]);
    };
    
    jsc.Thread.prototype[4] = function (block) {
        if (this.temp === null) {
            this.temp = Math.round(jsc.castNumber(block[1]()));
        }
        if (this.temp <= 0) {
            this.reset();
            return;
        }

        this.temp--;
        this.evalCommandList(true, block[2]);
    };
    
    jsc.Thread.prototype[5] = function (block) {
        if (!block[1]()) {
            this.evalCommandList(true, block[2]);
        }
    };
    
    jsc.Thread.prototype[6] = function (block) {
        this.evalCommandList(true, block[1]);
    };
    
    jsc.Thread.prototype[7] = function (block) {
        this.evalCommandList(true, block[1]() ? block[2] : null);
    };
    
    jsc.Thread.prototype[8] = function (block) {
        this.stop();
    };
    
    jsc.Thread.prototype[9] = function (block) {
        if (!block[1]()) {
            this.evalCommandList(true);
        }
    };
    
    jsc.Thread.prototype[10] = function (block) {
        if (!this.timer) {
            this.timer = new jsc.Stopwatch();
            this.evalCommandList(true);
            return;
        } else if (this.timer.getElapsed() < jsc.castNumber(block[1]()) * 1000) {
            this.evalCommandList(true);
            return;
        }
        this.reset();
    };
    
    jsc.Thread.prototype[11] = function (block) {
        if (!this.temp) {
            this.timer = new jsc.Stopwatch();
            this.temp = [this.object.position, this.object.stage.fromScratchCoords(new jsc.Point(jsc.castNumber(block[2]()), jsc.castNumber(block[3]()))), jsc.castNumber(block[1]())];
        } else if (this.timer.getElapsed() < this.temp[2] * 1000) {
            this.object.position = this.temp[0].subtract(this.temp[1]).multiplyBy(this.timer.getElapsed() / -1000 / this.temp[2]).add(this.temp[0]);
        } else {
            this.object.position = this.temp[1];
            this.reset();
            return;
        }
        this.evalCommandList(true);
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
        this.yield = false;
        this.script = commands || [];
        this.index = -1;
        this.timer = null;
        this.temp = null;
    };

    jsc.Thread.prototype.reset = function () {
        this.timer = null;
        this.temp = null;
    };

    jsc.Thread.prototype.pushState = function () {
        this.stack.push({
            yield: this.yield,
            script: this.script,
            index: this.index,
            timer: this.timer,
            temp: this.temp
        });
    };

    jsc.Thread.prototype.popState = function () {
        if (this.stack.length == 0) {
            this.script = [];
            this.index = 0;
            this.done = this.yield = true;
            return;
        }

        var oldState = this.stack.pop();
        this.yield = oldState.yield;
        this.script = oldState.script;
        this.index = oldState.index;
        this.timer = oldState.timer;
        this.temp = oldState.temp;
    };


    // Stopwatch //////////////////////////////////////////////
    jsc.Stopwatch = function () {
        this.init();
    }

    jsc.Stopwatch.prototype.init = function () {
        this.startTime = Date.now();
    };

    jsc.Stopwatch.prototype.reset = function () {
        this.startTime = Date.now();
    };

    jsc.Stopwatch.prototype.getElapsed = function () {
        return Date.now() - this.startTime;
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
        this.colorCache = {};
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
    
    jsc.SoundMedia.prototype.initBeforeLoad = function () {
        var self = this;
        this.audio = new Audio();
        this.audio.addEventListener('ended', function () {
            self.playing = false;
        }, false);
        
        if (this.compressedData) {
            this.decompress();
            this.sampleRate = this.compressedSampleRate;
        } else {
            this.samples = this.originalSound.samples;
            for (var i = 0; i < this.samples.length; i += 2) {
                var swap = this.samples[i];
                this.samples[i] = this.samples[i + 1];
                this.samples[i + 1] = swap;
            }
            this.sampleRate = 22050;
        }
        
        this.bitsPerSample = 16
        
        this.audio.src = jsc.createWave(this.samples, this.sampleRate, this.bitsPerSample);
        this.playing = false;
    };
    
    jsc.SoundMedia.prototype.stop = function () {
        this.audio.pause();
        try {
            this.audio.currentTime = 0;
        } catch (e) {}
        this.playing = false;
    };
    
    jsc.SoundMedia.prototype.play = function (volume) {
        this.stop();
        this.audio.volume = Math.max(Math.min(volume / 100, 1), 0);
        this.audio.play();
        this.playing = true;
    };
    
    jsc.SoundMedia.prototype.setVolume = function (volume) {
        this.audio.volume = volume;
    };
    
    jsc.SoundMedia.prototype.decompress = function () {
        var stepSizeTable = [7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80, 88, 97, 107, 118, 130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358, 5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767];
        
        var indices = [
            [-1, 2],
            [-1, -1, 2, 4],
            [-1, -1, -1, -1, 2, 4, 6, 8],
            [-1, -1, -1, -1, -1, -1, -1, -1, 1, 2, 4, 6, 8, 10, 13, 16]
        ];
        
        var indexTable = indices[this.compressedBitsPerSample - 2];
        var soundData = this.compressedData;
        var bitsPerSample = this.compressedBitsPerSample;
        
        var l5 = 0;
        var l6 = 0;
        var l7 = 0;
        var l8 = 0;
        var l2 = [];
        var l3 = 0;
        var l4 = 0;
        
        var index = 0;
        
        var bitPosition = 0;
        var currentByte = 0;
        
        var signMask = 1 << (bitsPerSample - 1);
        var valueMask = signMask - 1;
        var valueHighBit = signMask >> 1;
        
        while (true) {
            l5 = nextCode.call(this);
            if (l5 < 0) {
                break;
            }
            l6 = stepSizeTable[l4];
            l7 = 0;
            l8 = valueHighBit;
            while (l8 > 0) {
                if ((l5 & l8) !== 0) {
                    l7 += l6;
                }
                l6 = l6 >> 1;
                l8 = l8 >> 1;
            }
            l7 += l6;
            l3 += ((l5 & signMask) === 0) ? l7 : -l7
            l4 += indexTable[l5 & valueMask];
            l4 = Math.min(Math.max(l4, 0), 88);
            l3 = Math.min(Math.max(l3, -32768), 32767);
            l2.push(l3 & 255);
            l2.push((l3 >> 8) & 255);
        }
        
        function nextCode() {
            var j4 = 0;
            var j2 = 0;
            var j3 = bitsPerSample;
            
            while (true) {
                j4 = j3 - bitPosition;
                j2 += j4 < 0 ? currentByte >> -j4 : currentByte << j4;
                if (j4 > 0) {
                    j3 -= bitPosition;
                    if (index < soundData.length) {
                        currentByte = soundData[index++];
                        bitPosition = 8;
                    } else {
                        currentByte = 0;
                        bitPosition = 0;
                        return -1;
                    }
                } else {
                    bitPosition -= j3;
                    currentByte = currentByte & (255 >> (8 - bitPosition));
                    break;
                }
            }
            return j2;
        }
        this.samples = l2;
    };
    
    // SampledSound ///////////////////////////////////////////
    jsc.SampledSound = function () {

    }

    jsc.SampledSound.prototype = new jsc.ScratchMedia();
    jsc.SampledSound.prototype.constructor = jsc.SampledSound;

    jsc.SampledSound.prototype.initFields = function (fields, version) {
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
