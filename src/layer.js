/**
 * @file 图片列表——放大浮层
 * @author lizhaoxia(lizhaoxia@baidu.com)
 * @date 2013-12-09
 */

define(function (require) {
    var Mask = require('./mask');

    /**
     * 图片放大浮层
     * 
     * @constructor
     * @exports
     * @param {Object} options 配置项
     * @param {Array} options.dataList 图片列表数据
     * @param {boolean} options.rotatable 是否可旋转，默认为false
     * @param {string} options.prefix 浮层class前缀
     */
    function Layer(options) {
        T.extend(this, options);

        this.dataList = this.dataList || [];

        this.init();
    }

    /**
     * Layer新增prototype属性
     * 
     * @type {Object}
     */
    var proto = {
        /**
         * 初始化操作
         * 
         * @private
         */
        init: function () {
            // 生成一个视觉范围外的img节点
            var tempImg = T.dom.create('img', {
                style: 'position:absolute; left: -10000px; top:0;'
            });
            document.body.appendChild(tempImg);
            this.tempImg = tempImg;

            // 生成遮罩层节点
            this.mask = new Mask({
                prefix: this.prefix
            });
        },

        /**
         * 显示浮层
         * 
         * @public
         * @param {number} index 当前显示图片的索引(可选)
         */
        show: function (index) {
            index = index || 0;
            this.index = index;

            this.mask.show();
            if (!this.main) {
                this.createMain();
            }

            // hack：IE6不支持高宽自适应
            if (T.browser.ie && T.browser.ie == 6) {
                T.dom.setStyles(this.main, {
                    width: T.page.getViewWidth() + 'px',
                    height: T.page.getViewHeight() + 'px',
                    top: T.page.getScrollTop() + 'px'
                });
            }

            T.dom.show(this.main);

            this.bindEvent();

            this.renderImg();
        },

        /**
         * 渲染图片
         * 
         * @private
         */
        renderImg: function () {
            T.dom.hide(this.wrapper);
            T.dom.removeClass(this.main, 'error');
            this.tempImg.src = this.dataList[this.index].normalPic;
        },

        /**
         * 为图片浮层的相关节点绑定事件
         * 
         * @private
         */
        bindEvent: function () {
            T.on(this.main, 'click', this.getClickDispatcherHandler());

            T.on(this.tempImg, 'load', this.getImgLoadHandler());

            T.on(window, 'resize', this.getResizeHandler());

            T.on(document, 'keydown', this.getKeyDownHandler());

            T.on(this.tempImg, 'error', this.getImgErrorHandler());

            this.bindSlideMouseEvent('last');
            this.bindSlideMouseEvent('next');
        },

        /**
         * 为图片浮层的相关节点解绑事件
         * 
         * @private
         */
        unBindEvent: function () {
            T.un(this.main, 'click');

            T.un(this.tempImg, 'load');

            T.un(window, 'resize');

            T.un(document, 'keydown');

            T.un(this.tempImg, 'error');

            this.unBindSlideMouseEvent('last');
            this.unBindSlideMouseEvent('next');
        },

        /**
         * 关闭浮层
         * 
         * @public
         */
        hide: function () {
            this.mask.hide();
            T.dom.hide(this.main);

            this.unBindEvent();

            // 清除旋转状态
            this.removeRotateStyle();
            this.rotateDeg = 0;
            this.tempImg.src = '';
        },

        /**
         * 创建主体节点
         * 
         * @private
         */
        createMain: function () {
            var tpl = ''
                + '<div class="#{0}">'
                +     '<div class="#{0}-wrapper">'
                +         '<img src=""/>'
                +         '<a href="javascript:;" class="#{0}-close"></a>'
                +         '<div class="#{0}-last" title="上一张（↑键）">'
                +             '<a href="javascript:;" class="#{0}-last-bg"></a>'
                +             '<a href="javascript:;" class="#{0}-last-arrow">'
                +             '</a>'
                +         '</div>'
                +         '<div class="#{0}-next" title="下一张（↓键）">'
                +             '<a href="javascript:;" class="#{0}-next-bg"></a>'
                +             '<a href="javascript:;" class="#{0}-next-arrow">'
                +             '</a>'
                +         '</div>'
                +         '#{1}'
                +     '</div>'
                + '</div>';

            var rotataTpl = ''
                + '<a href="javascript:;" class="#{0}-rotate-left" '
                +     'title="左旋转（←键）">'
                + '</a>'
                + '<a href="javascript:;" class="#{0}-rotate-right" '
                +     'title="右旋转（→键）">'
                + '</a>';
            var rotateHtml = T.format(rotataTpl, this.prefix);

            var html = T.format(
                tpl,
                this.prefix,
                this.rotatable ? rotateHtml : ''
            );
            T.dom.insertHTML(document.body, 'beforeEnd', html);

            var main = T.dom.last(document.body);
            this.main = main;
            this.wrapper = T.q(this.prefix + '-wrapper', main)[0];
            this.img = T.dom.query('img', main)[0];
            this.last = T.q(this.prefix + '-last', main)[0];
            this.next = T.q(this.prefix + '-next', main)[0];
        },

        /**
         * 获取浮层点击事件分发处理函数
         * 
         * @private
         * @return {Function}
         */
        getClickDispatcherHandler: function () {
            var me = this;

            return function (e) {
                e = e || window.event;
                var target = T.event.getTarget(e);
                var className = T.dom.getAttr(target, 'class');
                if (!className) {
                    return;
                }

                var prefix = me.prefix;
                switch(className) {
                    // 关闭
                    case prefix + '-close':
                        me.hide();
                        break;
                    // 上一个
                    case prefix + '-last-bg':
                        me.slide(-1);
                        break;
                    case prefix + '-last-arrow':
                        me.slide(-1);
                        break;
                    // 下一个
                    case prefix + '-next-bg':
                        me.slide(1);
                        break;
                    case prefix + '-next-arrow':
                        me.slide(1);
                        break;
                    // 左旋转
                    case prefix + '-rotate-left':
                        me.rotate(-1);
                        break;
                    // 右旋转
                    case prefix + '-rotate-right':
                        me.rotate(1);
                        break;
                    // 图片以外区域，关闭
                    case prefix:
                        me.hide();
                        break;
                    // 图片以外区域(图片加载失败时)，关闭
                    case prefix + ' error':
                        me.hide();
                        break;
                    default:
                        break;
                }
            };
        },

        /**
         * 获取图片加载完成时的处理函数
         * 
         * @private
         * @return {Function}
         */
        getImgLoadHandler: function () {
            var me = this;

            return function () {
                // 移除或增加‘上一张’ICON
                if (me.index === 0 && me.last) {
                    me.removeSlideIcon('last');
                }
                else if (me.index > 0 && !me.last) {
                    me.addSlideIcon('last');
                }

                // 移除或增加‘下一张’ICON
                if (me.index === me.dataList.length - 1 && me.next) {
                    me.removeSlideIcon('next');
                }
                else if (me.index < me.dataList.length - 1 && !me.next) {
                    me.addSlideIcon('next');
                }

                me.img.src = me.tempImg.src;
                me.adjustSize();
                T.dom.show(me.wrapper);
            };
        },

        /**
         * 获取图片加载失败时的处理函数
         * 
         * @private
         * @return {Function}
         */
        getImgErrorHandler: function () {
            var me = this;

            return function () {
                T.dom.addClass(me.main, 'error');
            };
        },

        /**
         * 添加图片切换icon节点
         * 
         * @private
         * @param {string} type 新增icon类型, 取值:'last'-上一张；'next'-下一张
         */
        addSlideIcon: function (type) {
            var TPL = '<div class="#{0}-#{1}" title="#{2}">'
                +         '<a href="javascript:;" class="#{0}-#{1}-bg"></a>'
                +         '<a href="javascript:;" class="#{0}-#{1}-arrow"></a>'
                +     '</div>';

            var html = T.format(
                TPL, this.prefix, type,
                type === 'last' ? '上一张（↑键）' : '下一张（↓键）'
            );

            T.dom.insertHTML(this.wrapper, 'beforeEnd', html);
            this[type] = T.dom.last(this.wrapper);

            this.bindSlideMouseEvent(type);
        },

        /**
         * 移除图片切换icon节点
         * 
         * @private
         * @param {string} type 新增icon类型, 取值:'last'-上一张；'next'-下一张
         */
        removeSlideIcon: function (type) {
            this.unBindSlideMouseEvent(type);
            T.dom.remove(this[type]);
            delete this[type];
        },

        /**
         * 为图片切换icon绑定mouseover和mouseout事件
         * 
         * @private
         * @param {string} type 新增icon类型, 取值:'last'-上一张；'next'-下一张
         */
        bindSlideMouseEvent: function (type) {

            var slide = this[type];
            if (!slide) {
                return;
            }

            var prefix = this.prefix;
            var slideBg = T.q(prefix + '-' + type + '-bg', slide)[0];
            var slideIcon = T.q(prefix + '-' + type + '-arrow', slide)[0];

            var iconHover = prefix + '-' + type + '-arrow-hover';

            T.on(slideBg, 'mouseover', function () {
                T.addClass(slideIcon, iconHover);
            });

            T.on(slideIcon, 'mouseover', function () {
                T.addClass(slideBg, 'bg-hover');
            });

            T.on(slideBg, 'mouseout', function () {
                T.removeClass(slideIcon, iconHover);
            });

            T.on(slideIcon, 'mouseout', function () {
                T.removeClass(slideBg, 'bg-hover');
            });
        },

        /**
         * 为图片切换icon解绑mouseover和mouseout事件
         * 
         * @private
         * @param {string} type 新增icon类型, 取值:'last'-上一张；'next'-下一张
         */
        unBindSlideMouseEvent: function (type) {
            var slide = this[type];
            if (!slide) {
                return;
            }

            var prefix = this.prefix;
            var slideBg = T.q(prefix + '-' + type + '-bg', slide)[0];
            var slideIcon = T.q(prefix + '-' + type + '-arrow', slide)[0];

            T.un(slideBg, 'mouseover');

            T.un(slideIcon, 'mouseover');

            T.un(slideBg, 'mouseout');

            T.un(slideIcon, 'mouseout');
        },

        /**
         * 调整图片显示区域尺寸
         * 
         * @private
         * @param {boolean} reverse 当前显示图片是否旋转了90°或270°
         */
        adjustSize: function (reverse) {
            var tempImg = this.tempImg;
            var originalSize = {
                width: reverse ? tempImg.height : tempImg.width,
                height: reverse ? tempImg.width : tempImg.height
            };
            var size = this.computeSize(originalSize);

            // 设置wrapper尺寸
            var mainHeight = T.dom.getComputedStyle(this.main, 'height')
                || T.dom.getStyle(this.main, 'height');
            var marginTop = (parseInt(mainHeight, 10) - size.height) / 2;
            T.dom.setStyles(this.wrapper, {
                width: size.width + 'px',
                height: size.height + 'px',
                marginTop: marginTop + 'px'
            });

            // 设置图片尺寸
            T.dom.setStyles(this.img, {
                width: size.width + 'px',
                height: size.height + 'px'
            });

            // 设置‘上一张’，‘下一张’icon的位置
            if (this.last) {
                T.dom.setStyle(this.last, 'height', size.height + 'px');

                T.dom.setStyle(
                    T.dom.children(this.last)[1],
                    'top', size.height / 2 - 23 + 'px'
                );

                if (T.browser.ie === 6) {
                    T.dom.setStyle(
                        T.dom.children(this.last)[0],
                        'height', size.height + 'px'
                    );
                }
            }

            if (this.next) {
                T.dom.setStyle(this.next, 'height', size.height + 'px');

                T.dom.setStyle(
                    T.dom.children(this.next)[1],
                    'top', size.height / 2 - 23 + 'px'
                );

                if (T.browser.ie === 6) {
                    T.dom.setStyle(
                        T.dom.children(this.next)[0],
                        'height', size.height + 'px'
                    );
                }
            }

            // 设置‘左旋转’，‘右旋转’icon的位置
            if (this.rotatable) {
                T.dom.setStyle(
                    T.q(this.prefix + '-rotate-left', this.main)[0],
                    'left',
                    size.width / 2 - 35 + 'px'
                );

                T.dom.setStyle(
                    T.q(this.prefix + '-rotate-right', this.main)[0],
                    'right',
                    size.width / 2 - 35 + 'px'
                );
            }
        },

        /**
         * 根据图片原始尺寸及窗口可视区域大小，计算调整后的尺寸
         * 
         * @private
         * @param {Object} originalSize 图片原始尺寸
         * @param {number} originalSize.width 图片原始宽度
         * @param {number} originalSize.height 图片原始高度
         * @return {Object} 调整后尺寸，格式同originalSize
         */
        computeSize: function (originalSize) {
            var clientWidth = T.page.getViewWidth();
            var clientHeight = T.page.getViewHeight();
            var maxWidth = clientWidth >= 140 ? clientWidth - 140 : 0;
            var maxHeight = clientHeight >= 100 ? clientHeight - 100 : 0;
            var oriWidth = originalSize.width;
            var oriHeight = originalSize.height;
            var size = {};

            // 原图较小，不需调整
            if (oriWidth <= maxWidth && oriHeight <= maxHeight) {
                size = originalSize;
            }
            // 原图宽/高偏大，保持最大宽度
            else if (oriWidth / oriHeight >= maxWidth / maxHeight) {
                size.width = maxWidth;
                size.height = maxWidth * oriHeight / oriWidth;
            }
            // 原图宽/高偏小，保持最大高度
            else if (oriWidth / oriHeight < maxWidth / maxHeight) {
                size.height = maxHeight;
                size.width = maxHeight * oriWidth / oriHeight;
            }

            return size;
        },

        /**
         * 获取窗口resize时的处理函数
         * 
         * @private
         * @return {Function}
         */
        getResizeHandler: function () {
            var me = this;

            return function () {
                var deg = me.rotateDeg;

                if (deg !== undefined && deg % 180 !== 0) {
                    me.adjustSize(true);
                    me.reverseSize(me.img);
                    me.rotateImgTo(deg);
                }
                else {
                    me.adjustSize();
                }

                // hack：IE6不支持高宽自适应
                if (T.browser.ie && T.browser.ie === 6) {
                    T.dom.setStyles(me.main, {
                        width: T.page.getViewWidth() + 'px',
                        height: T.page.getViewHeight() + 'px',
                        top: T.page.getScrollTop() + 'px'
                    });
                }
            };
        },

        /**
         * 获取键盘操作时的处理函数
         * 
         * @private
         * @return {Function}
         */
        getKeyDownHandler: function () {
            var me = this;

            return function (e) {
                e = e || window.event;
                var keyCode = T.event.getKeyCode(e);

                switch(keyCode) {
                    // 向上键(↑)，查看上一张
                    case 38:
                        me.slide(-1);
                        break;
                    // 向下键(↓)，查看下一张
                    case 40:
                        me.slide(1);
                        break;
                    // 向左键(←)，逆时针旋转90°
                    case 37:
                        me.rotate(-1);
                        break;
                    // 向右键(→)，顺时针旋转90°
                    case 39:
                        me.rotate(1);
                        break;
                    // Esc键，关闭
                    case 27:
                        me.hide();
                        break;
                    default:
                        break;
                }
            };
        },

        /**
         * 图片切换
         * 
         * @private
         * @param {number} tag 切换标示，-1：上一张；1：下一张
         */
        slide: function (tag) {
            var targetIndex = this.index + tag;

            if (targetIndex < 0 || targetIndex >= this.dataList.length) {
                return;
            }

            // this.tempImg.src = '';
            this.removeRotateStyle();
            this.rotateDeg = 0;
            this.index = targetIndex;
            this.renderImg();
        },

        /**
         * 图片旋转
         * 
         * @private
         * @param {number} tag 旋转标示，-1：逆时针旋转90°；1：顺时针旋转90°
         */
        rotate: function (tag) {
            if (!this.rotatable) {
                return;
            }

            if (!T.browser.ie) {
                this.removeRotateStyle();
            }

            var currentDeg = this.rotateDeg || 0;
            var targetDeg = currentDeg + tag * 90;
            if (targetDeg === -90) {
                targetDeg = 270;
            }
            else if (targetDeg === 360) {
                targetDeg = 0;
            }

            if (targetDeg % 180 !== 0) {
                this.adjustSize(true);
                this.reverseSize(this.img);
            }
            else {
                this.adjustSize();
            }

            this.rotateImgTo(targetDeg);

            this.rotateDeg = targetDeg;
        },

        /**
         * 将放大的图片旋转到指定角度
         * 
         * @private
         * @param {number} deg 旋转到的角度，取值范围：0, 90, 180, 270
         */
        rotateImgTo: function (deg) {
            var width = parseInt(this.wrapper.style.width, 10);
            var height = parseInt(this.wrapper.style.height, 10);

            var sin = Math.round(Math.sin(2 * Math.PI / 360 * deg));
            var cos = Math.round(Math.cos(2 * Math.PI / 360 * deg));

            var matrixValue = [
                cos, sin, -sin, cos,
                deg % 180 !== 0 ? (width - height) / 2 : 0,
                deg % 180 !== 0 ? (height - width) / 2 : 0
            ].join(',');

            T.dom.setStyles(this.img, {
                'transform': 'matrix(' + matrixValue + ')',
                '-ms-transform': 'matrix(' + matrixValue + ')',
                '-moz-transform': 'matrix(' + matrixValue + ')',
                '-webkit-transform': 'matrix(' + matrixValue + ')',
                '-o-transform': 'matrix(' + matrixValue + ')'
            });

            if (T.browser.ie) {
                T.dom.setStyle(
                    this.img, 'filter',
                    'progid:DXImageTransform.Microsoft.BasicImage(rotation='
                        + deg / 90 + ')'
                );
            }
        },

        /**
         * 清除显示图片的旋转样式
         * 
         * @private
         */
        removeRotateStyle: function () {
            var img = this.img;

            T.dom.removeStyle(img, 'transform');
            T.dom.removeStyle(img, '-webkit-transform');
            T.dom.removeStyle(img, '-ms-transform');
            T.dom.removeStyle(img, '-o-transform');
            T.dom.removeStyle(img, '-moz-transform');

            if (T.browser.ie) {
                T.dom.removeStyle(img, 'filter');
            }
        },

        /**
         * 将目标元素的宽度和高度对调
         * 
         * @private
         * @param {HTMLElement} ele 需要对调尺寸的元素
         */
        reverseSize: function (ele) {
            var width = ele.style.width;
            var height = ele.style.height;

            ele.style.width = height;
            ele.style.height = width;
        }
    };

    T.extend(Layer.prototype, proto);

    return Layer;
});