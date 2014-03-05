/**
 * @file 图片列表——遮罩层
 * @author lizhaoxia(lizhaoxia@baidu.com)
 * @date 2013-12-09
 */

define(function (require) {
    var instance; // 遮罩层实例容器

    /**
     * 遮罩层控件(单例)
     * 
     * @constructor
     * @exports
     * @param {string} options.prefix class前缀
     */
    function Mask(options) {
        if (typeof instance === 'object') {
            return instance;
        }

        this.prefix = options.prefix;
        this.init();

        instance = this;
    }

    /**
     * Mask新增prototype属性
     * 
     * @type {Object}
     */
    var proto = {
        /**
         * 初始化遮罩层
         * 
         * @private
         */
        init: function () {
            var el = document.createElement('div');
            document.body.appendChild(el);
            this.main = el;
        },

        /**
         * 重绘遮罩层尺寸(IE6下调用)
         * 
         * @private
         */
        repaintMask: function () {
            var mask = this.main;
            var width = Math.max(
                            document.documentElement.clientWidth,
                            Math.max(
                                document.body.scrollWidth,
                                document.documentElement.scrollWidth
                            )
                        );
            var height = Math.max(
                            document.documentElement.clientHeight,
                            Math.max(
                                document.body.scrollHeight,
                                document.documentElement.scrollHeight
                            )
                        );

            mask.style.width  = width + 'px';
            mask.style.height = height + 'px';
        },

        /**
         * 显示遮罩层
         * 
         * @public
         */
        show: function () {
            var me = this;
            var mask = me.main;
            mask.className = me.prefix + '-mask';
            mask.style.display = 'block';

            // 禁用滚动条
            var html = document.getElementsByTagName('html')[0];
            T.dom.setStyle(html, 'overflow', 'hidden');

            // hack：IE6下无法自适应高度
            if (T.browser.ie && T.browser.ie <= 6) {
                me.repaintMask();

                T.on(window, 'resize', function () {
                    me.repaintMask();
                });
            }

            // 绑定点击事件
            T.on(mask, 'click', function () {
                me.hide();
            });

            me.isShow = true;
        },

        /**
         * 隐藏遮罩层
         * 
         * @public
         */
        hide: function () {
            if (!this.isShow) {
                return;
            }

            var mask = this.main;
            mask.style.display = 'none';

            // 启用用滚动条
            var html = document.getElementsByTagName('html')[0];
            T.dom.setStyle(html, 'overflow', 'auto');

            // IE6下解绑resize
            if (T.browser.ie && T.browser.ie <= 6) {
                T.un(window, 'resize');
            }

            T.un(mask, 'click');

            this.isShow = false;
        }
    };

    T.extend(Mask.prototype, proto);

    return Mask;
});