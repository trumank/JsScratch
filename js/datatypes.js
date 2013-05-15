var jsc = new (function JsScratch() {});

(function (jsc) {
    // Form ///////////////////////////////////////////////////
    jsc.Form = function (width, height, depth, offset, bits, colors) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.offset = offset;
        //this.bits = bits;
        if (colors) {
            this.colors = colors;
        }
    };

    jsc.Form.prototype.getImage = function () {
        var canvas = jsc.newCanvas(this.width, this.height);
        var ctx = canvas.getContext('2d');

        this.data = this.bits.isBitmap ? this.bits : this.decodePixels();

        var data = ctx.createImageData(this.width, this.height);
        this.setImageData(data);
        ctx.putImageData(data, 0, 0);
        return canvas;
    };

    jsc.Form.prototype.extent = function () {
        return new jsc.Point(this.width, this.height);
    };

    jsc.Form.prototype.decodePixels = function () {
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

    jsc.Form.prototype.decodeInt = function (stream) {
        var i = stream.getUint8();
        if (i <= 223)
            return i;
        if (i <= 254)
            return (i - 224) * 256 + stream.getUint8();
        return stream.getUint32();
    };

    jsc.Form.prototype.setImageData = function (data) {
        var array = data.data;
        if (this.depth <= 8) {
            var colors = this.colors || jsc.squeakColors;
            var l = this.data.length / this.height;
            var i1 = (1 << this.depth) - 1;
            var j1 = 32 / this.depth;
            for(var y = 0; y < this.height; y++) {
                for(var x = 0; x < this.width; x++) {
                    var i2 = this.data[y * l + (x - (x % j1)) / j1];
                    var j2 = this.depth * (j1 - x % j1 - 1);
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
            var data = [];
            var hw = Math.round((this.width) / 2);
            var index = 0, i, j;
            for (var y = 0; y < this.height; y++) {
                i = 0;
                for (var x = 0; x < this.width; x++) {
                    j = this.data[y * hw + Math.round(x / 2)] >> i & 0xFFFF;
                    //index = (x + y * this.width) * 4;
                    array[index++] = (j >> 10 & 0x1F) << 3;
                    array[index++] = (j >> 5 & 0x1F) << 3;
                    array[index++] = (j & 0x1F) << 3;
                    array[index++] = 0xFF;
                    i = i === 16 ? 0 : 16;
                }
            }
            this.data = data;
        }
        if (this.depth == 32) {
            for (var i = 0; i < array.length; i += 4) {
                var c = this.data[i / 4];
                array[i] = (c >> 16) & 0xFF;
                array[i + 1] = (c >> 8) & 0xFF;
                array[i + 2] = c & 0xFF;
                array[i + 3] = c === 0 ? 0 : 255;
            }
        }
    }

    // Color //////////////////////////////////////////////////
    jsc.Color = function (r, g, b, a) {
        this.r = r || 0;
        this.g = g || 0;
        this.b = b || 0;
        this.a = (a === 0) ? 0 : a || 255;
    };

    jsc.Color.prototype.toString = function () {
        return 'rgba(' + (this.r | 0) + ',' + (this.g | 0) + ',' + (this.b | 0) + ',' + (this.a | 0) + ')';
    };
    
    jsc.Color.prototype.getHSL = function () {
        var r = this.r / 255;
        var g = this.g / 255;
        var b = this.b / 255;
        
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if(max == min){
            h = s = 0;
        }else{
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max){
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [h, s, l];
    };
    
    jsc.Color.prototype.setHSL = function (hsl) {
        var h = hsl[0];
        var s = hsl[1];
        var l = hsl[2];
        
        var r, g, b;

        if (s == 0) {
            r = g = b = l;
        } else {
            function hue2rgb(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        this.r = r * 255;
        this.g = g * 255;
        this.b = b * 255;
    };

    jsc.radians = function (degrees) {
        return degrees / (Math.PI * 180);
    };

    jsc.degrees = function (radians) {
        return radians * Math.PI * 180;
    };

    // jsc.Point //////////////////////////////////////////////////
    jsc.Point = function (x, y) {
        this.x = x || 0;
        this.y = y || 0;
    };

    jsc.Point.prototype.copy = function () {
        return new jsc.Point(this.x, this.y);
    };

    jsc.Point.prototype.eq = function (aPoint) {
        return this.x === aPoint.x && this.y === aPoint.y;
    };

    jsc.Point.prototype.lt = function (aPoint) {
        return this.x < aPoint.x && this.y < aPoint.y;
    };

    jsc.Point.prototype.gt = function (aPoint) {
        return this.x > aPoint.x && this.y > aPoint.y;
    };

    jsc.Point.prototype.ge = function (aPoint) {
        return this.x >= aPoint.x && this.y >= aPoint.y;
    };

    jsc.Point.prototype.le = function (aPoint) {
        return this.x <= aPoint.x && this.y <= aPoint.y;
    };

    jsc.Point.prototype.max = function (aPoint) {
        return new jsc.Point(Math.max(this.x, aPoint.x),
            Math.max(this.y, aPoint.y));
    };

    jsc.Point.prototype.min = function (aPoint) {
        return new jsc.Point(Math.min(this.x, aPoint.x),
            Math.min(this.y, aPoint.y));
    };

    jsc.Point.prototype.round = function () {
        return new jsc.Point(Math.round(this.x), Math.round(this.y));
    };

    jsc.Point.prototype.abs = function () {
        return new jsc.Point(Math.abs(this.x), Math.abs(this.y));
    };

    jsc.Point.prototype.neg = function () {
        return new jsc.Point(-this.x, -this.y);
    };

    jsc.Point.prototype.mirror = function () {
        return new jsc.Point(this.y, this.x);
    };

    jsc.Point.prototype.floor = function () {
        return new jsc.Point(
            Math.max(Math.floor(this.x), 0),
            Math.max(Math.floor(this.y), 0)
        );
    };

    jsc.Point.prototype.ceil = function () {
        return new jsc.Point(Math.ceil(this.x), Math.ceil(this.y));
    };

    jsc.Point.prototype.add = function (other) {
        if (other instanceof jsc.Point) {
            return new jsc.Point(this.x + other.x, this.y + other.y);
        }
        return new jsc.Point(this.x + other, this.y + other);
    };

    jsc.Point.prototype.subtract = function (other) {
        if (other instanceof jsc.Point) {
            return new jsc.Point(this.x - other.x, this.y - other.y);
        }
        return new jsc.Point(this.x - other, this.y - other);
    };

    jsc.Point.prototype.multiplyBy = function (other) {
        if (other instanceof jsc.Point) {
            return new jsc.Point(this.x * other.x, this.y * other.y);
        }
        return new jsc.Point(this.x * other, this.y * other);
    };

    jsc.Point.prototype.divideBy = function (other) {
        if (other instanceof jsc.Point) {
            return new jsc.Point(this.x / other.x, this.y / other.y);
        }
        return new jsc.Point(this.x / other, this.y / other);
    };

    jsc.Point.prototype.floorDivideBy = function (other) {
        if (other instanceof jsc.Point) {
            return new jsc.Point(Math.floor(this.x / other.x),
                Math.floor(this.y / other.y));
        }
        return new jsc.Point(Math.floor(this.x / other),
            Math.floor(this.y / other));
    };

    jsc.Point.prototype.r = function () {
        var t = (this.multiplyBy(this));
        return Math.sqrt(t.x + t.y);
    };

    jsc.Point.prototype.degrees = function () {
    /*
        answer the angle I make with origin in degrees.
        Right is 0, down is 90
    */
        var tan, theta;

        if (this.x === 0) {
            if (this.y >= 0) {
                return 90;
            }
            return 270;
        }
        tan = this.y / this.x;
        theta = Math.atan(tan);
        if (this.x >= 0) {
            if (this.y >= 0) {
                return degrees(theta);
            }
            return 360 + (degrees(theta));
        }
        return 180 + degrees(theta);
    };

    jsc.Point.prototype.theta = function () {
    /*
        answer the angle I make with origin in radians.
        Right is 0, down is 90
    */
        var tan, theta;

        if (this.x === 0) {
            if (this.y >= 0) {
                return radians(90);
            }
            return radians(270);
        }
        tan = this.y / this.x;
        theta = Math.atan(tan);
        if (this.x >= 0) {
            if (this.y >= 0) {
                return theta;
            }
            return radians(360) + theta;
        }
        return radians(180) + theta;
    };

    // jsc.Point functions:

    jsc.Point.prototype.crossProduct = function (aPoint) {
        return this.multiplyBy(aPoint.mirror());
    };

    jsc.Point.prototype.distanceTo = function (aPoint) {
        return (aPoint.subtract(this)).r();
    };

    jsc.Point.prototype.rotate = function (direction, center) {
        // direction must be 'right', 'left' or 'pi'
        var offset = this.subtract(center);
        if (direction === 'right') {
            return new jsc.Point(-offset.y, offset.y).add(center);
        }
        if (direction === 'left') {
            return new jsc.Point(offset.y, -offset.y).add(center);
        }
        // direction === 'pi'
        return center.subtract(offset);
    };

    jsc.Point.prototype.flip = function (direction, center) {
        // direction must be 'vertical' or 'horizontal'
        if (direction === 'vertical') {
            return new jsc.Point(this.x, center.y * 2 - this.y);
        }
        // direction === 'horizontal'
        return new jsc.Point(center.x * 2 - this.x, this.y);
    };

    jsc.Point.prototype.distanceAngle = function (dist, angle) {
        var deg = angle, x, y;
        if (deg > 270) {
            deg = deg - 360;
        } else if (deg < -270) {
            deg = deg + 360;
        }
        if (-90 <= deg && deg <= 90) {
            x = Math.sin(radians(deg)) * dist;
            y = Math.sqrt((dist * dist) - (x * x));
            return new jsc.Point(x + this.x, this.y - y);
        }
        x = Math.sin(radians(180 - deg)) * dist;
        y = Math.sqrt((dist * dist) - (x * x));
        return new jsc.Point(x + this.x, this.y + y);
    };

    // jsc.Point transforming:

    jsc.Point.prototype.scaleBy = function (scalePoint) {
        return this.multiplyBy(scalePoint);
    };

    jsc.Point.prototype.translateBy = function (deltaPoint) {
        return this.add(deltaPoint);
    };

    jsc.Point.prototype.rotateBy = function (angle) {
        return new jsc.Point(this.x * Math.cos(angle) - this.y * Math.sin(angle), this.x * Math.sin(angle) + this.y * Math.cos(angle));
    };

    // jsc.Point conversion:

    jsc.Point.prototype.asArray = function () {
        return [this.x, this.y];
    };

    // Rectangle //////////////////////////////////////////////
    jsc.Rectangle = function (left, top, right, bottom) {
        this.init(new jsc.Point((left || 0), (top || 0)),
                new jsc.Point((right || 0), (bottom || 0)));
    }

    jsc.Rectangle.prototype.init = function (originPoint, cornerPoint) {
        this.origin = originPoint;
        this.corner = cornerPoint;
    };

    // Rectangle string representation: e.g. '[0@0 | 160@80]'

    jsc.Rectangle.prototype.toString = function () {
        return '[' + this.origin.toString() + ' | ' +
            this.extent().toString() + ']';
    };

    // Rectangle copying:

    jsc.Rectangle.prototype.copy = function () {
        return new jsc.Rectangle(
            this.left(),
            this.top(),
            this.right(),
            this.bottom()
        );
    };

    // creating Rectangle instances from jsc.Points:

    jsc.Point.prototype.corner = function (cornerPoint) {
        // answer a new jsc.Rectangle
        return new jsc.Rectangle(
            this.x,
            this.y,
            cornerPoint.x,
            cornerPoint.y
        );
    };

    jsc.Point.prototype.rectangle = function (aPoint) {
        // answer a new jsc.Rectangle
        var org, crn;
        org = this.min(aPoint);
        crn = this.max(aPoint);
        return new jsc.Rectangle(org.x, org.y, crn.x, crn.y);
    };

    jsc.Point.prototype.extent = function (aPoint) {
        //answer a new jsc.Rectangle
        var crn = this.add(aPoint);
        return new jsc.Rectangle(this.x, this.y, crn.x, crn.y);
    };

    // Rectangle accessing - setting:

    jsc.Rectangle.prototype.setTo = function (left, top, right, bottom) {
        // note: all inputs are optional and can be omitted

        this.origin = new jsc.Point(
            left || ((left === 0) ? 0 : this.left()),
            top || ((top === 0) ? 0 : this.top())
        );

        this.corner = new jsc.Point(
            right || ((right === 0) ? 0 : this.right()),
            bottom || ((bottom === 0) ? 0 : this.bottom())
        );
    };

    // Rectangle accessing - getting:

    jsc.Rectangle.prototype.area = function () {
        //requires width() and height() to be defined
        var w = this.width();
        if (w < 0) {
            return 0;
        }
        return Math.max(w * this.height(), 0);
    };

    jsc.Rectangle.prototype.bottom = function () {
        return this.corner.y;
    };

    jsc.Rectangle.prototype.bottomCenter = function () {
        return new jsc.Point(this.center().x, this.bottom());
    };

    jsc.Rectangle.prototype.bottomLeft = function () {
        return new jsc.Point(this.origin.x, this.corner.y);
    };

    jsc.Rectangle.prototype.bottomRight = function () {
        return this.corner.copy();
    };

    jsc.Rectangle.prototype.boundingBox = function () {
        return this;
    };

    jsc.Rectangle.prototype.center = function () {
        return this.origin.add(
            this.corner.subtract(this.origin).floorDivideBy(2)
        );
    };

    jsc.Rectangle.prototype.corners = function () {
        return [this.origin,
            this.bottomLeft(),
            this.corner,
            this.topRight()];
    };

    jsc.Rectangle.prototype.extent = function () {
        return this.corner.subtract(this.origin);
    };

    jsc.Rectangle.prototype.height = function () {
        return this.corner.y - this.origin.y;
    };

    jsc.Rectangle.prototype.left = function () {
        return this.origin.x;
    };

    jsc.Rectangle.prototype.leftCenter = function () {
        return new jsc.Point(this.left(), this.center().y);
    };

    jsc.Rectangle.prototype.right = function () {
        return this.corner.x;
    };

    jsc.Rectangle.prototype.rightCenter = function () {
        return new jsc.Point(this.right(), this.center().y);
    };

    jsc.Rectangle.prototype.top = function () {
        return this.origin.y;
    };

    jsc.Rectangle.prototype.topCenter = function () {
        return new jsc.Point(this.center().x, this.top());
    };

    jsc.Rectangle.prototype.topLeft = function () {
        return this.origin;
    };

    jsc.Rectangle.prototype.topRight = function () {
        return new jsc.Point(this.corner.x, this.origin.y);
    };

    jsc.Rectangle.prototype.width = function () {
        return this.corner.x - this.origin.x;
    };

    jsc.Rectangle.prototype.position = function () {
        return this.origin;
    };

    // Rectangle comparison:

    jsc.Rectangle.prototype.eq = function (aRect) {
        return this.origin.eq(aRect.origin) &&
            this.corner.eq(aRect.corner);
    };

    jsc.Rectangle.prototype.abs = function () {
        var newOrigin, newCorner;

        newOrigin = this.origin.abs();
        newCorner = this.corner.max(newOrigin);
        return newOrigin.corner(newCorner);
    };

    // Rectangle functions:

    jsc.Rectangle.prototype.insetBy = function (delta) {
        // delta can be either a jsc.Point or a Number
        var result = new jsc.Rectangle();
        result.origin = this.origin.add(delta);
        result.corner = this.corner.subtract(delta);
        return result;
    };

    jsc.Rectangle.prototype.expandBy = function (delta) {
        // delta can be either a jsc.Point or a Number
        var result = new jsc.Rectangle();
        result.origin = this.origin.subtract(delta);
        result.corner = this.corner.add(delta);
        return result;
    };

    jsc.Rectangle.prototype.intersect = function (aRect) {
        var result = new jsc.Rectangle();
        result.origin = this.origin.max(aRect.origin);
        result.corner = this.corner.min(aRect.corner);
        return result;
    };

    jsc.Rectangle.prototype.merge = function (aRect) {
        var result = new jsc.Rectangle();
        result.origin = this.origin.min(aRect.origin);
        result.corner = this.corner.max(aRect.corner);
        return result;
    };

    jsc.Rectangle.prototype.round = function () {
        return this.origin.round().corner(this.corner.round());
    };

    jsc.Rectangle.prototype.spread = function () {
        // round me by applying floor() to my origin and ceil() to my corner
        return this.origin.floor().corner(this.corner.ceil());
    };

    jsc.Rectangle.prototype.amountToTranslateWithin = function (aRect) {
    /*
        Answer a jsc.Point, delta, such that self + delta is forced within
        aRectangle. when all of me cannot be made to fit, prefer to keep
        my topLeft inside. Taken from Squeak.
    */
        var dx = 0, dy = 0;

        if (this.right() > aRect.right()) {
            dx = aRect.right() - this.right();
        }
        if (this.bottom() > aRect.bottom()) {
            dy = aRect.bottom() - this.bottom();
        }
        if ((this.left() + dx) < aRect.left()) {
            dx = aRect.left() - this.left();
        }
        if ((this.top() + dy) < aRect.top()) {
            dy = aRect.top() - this.top();
        }
        return new jsc.Point(dx, dy);
    };

    // Rectangle testing:

    jsc.Rectangle.prototype.containsPoint = function (aPoint) {
        return this.origin.le(aPoint) && aPoint.lt(this.corner);
    };

    jsc.Rectangle.prototype.containsRectangle = function (aRect) {
        return aRect.origin.gt(this.origin) &&
            aRect.corner.lt(this.corner);
    };

    jsc.Rectangle.prototype.intersects = function (aRect) {
        var ro = aRect.origin, rc = aRect.corner;
        return (rc.x >= this.origin.x) &&
            (rc.y >= this.origin.y) &&
            (ro.x <= this.corner.x) &&
            (ro.y <= this.corner.y);
    };

    // Rectangle transforming:

    jsc.Rectangle.prototype.scaleBy = function (scale) {
        // scale can be either a jsc.Point or a scalar
        var o = this.origin.multiplyBy(scale),
            c = this.corner.multiplyBy(scale);
        return new jsc.Rectangle(Math.min(o.x, c.x), Math.min(o.y, c.y), Math.max(o.x, c.x), Math.max(o.y, c.y));
    };

    jsc.Rectangle.prototype.translateBy = function (factor) {
        // factor can be either a jsc.Point or a scalar
        var o = this.origin.add(factor),
            c = this.corner.add(factor);
        return new jsc.Rectangle(o.x, o.y, c.x, c.y);
    };

    // Rectangle converting:

    jsc.Rectangle.prototype.asArray = function () {
        return [this.left(), this.top(), this.right(), this.bottom()];
    };

    jsc.Rectangle.prototype.asArray_xywh = function () {
        return [this.left(), this.top(), this.width(), this.height()];
    };
}) (jsc);
