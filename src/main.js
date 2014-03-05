/**
 * @file 图片列表主模块
 * @author lizhaoxia(lizhaoxia@baidu.com)
 * @date 2013-12-06
 */

define(function (require) {
    var Layer = require('./layer');
    var Pager = require('./pager/pager');

    /**
     * 图片列表控件
     * 
     * @constructor
     * @exports
     * @param {Object} options 配置项
     * @param {Array} options.dataList 图片列表数据
     * @param {string} options.target 渲染节点
     * @param {number|string} options.width 图片宽度(默认100)
     * @param {number|string} options.height 图片高度(默认100)
     * @param {boolean} options.showLayer 是否通过浮层放大图片(默认false)
     * @param {boolean} options.rotatable 浮层放大图片是否可旋转(默认false)
     * @param {Function} options.ondelete 删除图片回调处理函数(可选)
     * @param {boolean} options.showTitle 是否显示图片标题(可选)
     * @param {boolean} options.showDesc 是否显示图片描述(可选)
     * @param {Function} options.desc 获取图片描述(可选)
     * @param {number} options.maxNum 单页最多显示个数，若无，则全部显示
     * @param {string} options.prefix 图片列表class前缀(可选)
     */
    function ImgList(options) {
        T.extend(this, options);

        this.dataList = this.dataList || [];
        this.target = T.g(this.target);
        this.width = this.width || '100';
        this.height = this.height || '100';
        this.prefix = this.prefix || 'ui-img-list';
    }

    /**
     * ImgList新增prototype属性
     * 
     * @type {Object}
     */
    var proto = {
        /**
         * 渲染图片列表
         * 
         * @public
         */
        render: function () {
            var target = this.target;

            if (!target) {
                return;
            }

            T.dom.empty(target);
            var list = T.dom.create('ul');
            target.appendChild(list);
            T.dom.addClass(list, this.prefix);
            this.list = list;

            if (this.maxNum && this.maxNum < this.dataList.length) {
                this.renderPager();
            }
            this.insertImgList();

            if (this.showLayer) {
                this.initLayer();
            }

            this.bindEvent();
        },

        /**
         * 初始化图片放大浮层
         * 
         * @private
         */
        initLayer: function () {
            var me = this;
            me.layer = new Layer({
                dataList: me.dataList,
                rotatable: !!me.rotatable,
                prefix: me.prefix + '-layer'
            });
        },

        /**
         * 插入图片列表
         * 
         * @param {number} page 插入图片的第几页
         * @private
         */
        insertImgList: function (page) {
            page = page || 0;
            var me = this;
            var max = me.maxNum;
            var dataList = me.dataList;
            var list = me.list;

            if (me.pager) {
                dataList = dataList.slice(page * max, page * max + max);
            }

            T.dom.empty(list);
            T.each(dataList, function (data, index) {
                var html = me.getImgHtml(data);
                T.dom.insertHTML(list, 'beforeEnd', html);
            });
        },

        /**
         * 给图片列表中添加图片
         * 
         * @public
         * @param {Object|Array} data 图片数据(可以是数据对象或者数组)
         * @param {string} data.normalPic 正常图url
         * @param {string} data.smallPic 缩略图url(可选)
         * @param {boolean} data.readonly 只读不可删除标识(可选)
         * @param {string} data.title 图片标题(可选)
         * @param {string} data.desc 图片描述(可选)
         */
        add: function (data) {
            var me = this;
            if (data instanceof Array) {
                T.each(data, function (item, index) {
                    me.add(item);
                });
                return;
            }

            var list = this.list;
            var dataList = this.dataList;
            var max = this.maxNum;
            var len = dataList.length;

            // 存在分页且当前不为最后一页，则先转到最后一页
            if (
                this.pager
                && this.currentPage < this.totalPage - 1
                && len % max > 0
            ) {
                this.turnToPage(this.totalPage - 1);
            }
            // 存在分页，最后一页满，新增一页
            else if (this.pager && 0 === len % max) {
                this.pager.total++;
                this.pager.render();
                this.totalPage++;
                this.turnToPage(this.totalPage - 1);
            }
            dataList.push(data);

            // 原来无分页，但定义了最大数目
            // 且当前个数=最大个数，新增需要添加分页控件
            if (max && max === len && !this.pager) {
                this.renderPager();
                this.turnToPage(1);
            }
            else {
                T.dom.insertHTML(list, 'beforeEnd', this.getImgHtml(data));
            }

            if (this.showLayer) {
                this.layer.dataList = dataList;
            }
        },

        /**
         * 获取单个图片的html
         * 
         * @private
         * @param {Object} data 图片数据
         * @param {string} data.normalPic 正常图url
         * @param {string} data.smallPic 缩略图url(可选)
         * @param {boolean} data.readonly 只读不可删除标识(可选)
         * @param {string} data.title 图片标题(可选)
         * @param {string} data.desc 图片描述(可选)
         * @return {string}
         */
        getImgHtml: function (data) {
            var TPL = '<li class="#{9}-item">'
                +         '<a class="#{9}-link" href="#{0}" target="_blank" #{5}>'
                +             '<img src="#{1}"#{8} '
                +                 'style="width:#{2}px;height:#{3}px;"'
                +             ' />'
                +             '#{4}'
                +         '</a>'
                +         '#{6}'
                +         '#{7}'
                +     '</li>';

            var delHtml = '<span class="' + this.prefix + '-del" '
                +             'data-click="delete">&nbsp;</span>';

            var titleHtml = '';
            var title = data.title;
            if (this.showTitle) {
                titleHtml = '<div class="' + this.prefix + '-title"'
                    +           'style="width:' + this.width + 'px;"'
                    +           (title ? ' title="' + title + '"' : '')
                    +       '>'
                    +           (title ? title : '&nbsp;')
                    +       '</div>';
            }

            var descHtml = '';
            var desc = data.desc;
            if (this.showDesc) {
                descHtml = '<div class="' + this.prefix + '-desc" '
                    +          'style="width:' + this.width + 'px;"'
                    +           (desc ? ' title="' + desc + '"' : '')
                    +      '>'
                    +          (data.desc || this.desc(data))
                    +      '</div>';
            }

            return T.format(TPL,
                data.normalPic,
                data.smallPic ? data.smallPic : data.normalPic,
                this.width,
                this.height,
                this.readonly || data.readonly ? '' : delHtml,
                data.title ? 'title="' + data.title + '"' : '',
                titleHtml,
                descHtml,
                this.showLayer ? 'data-click="show-layer"' :'',
                this.prefix
            );
        },

        /**
         * 为图片列表绑定事件
         * 
         * @private
         */
        bindEvent: function () {
            var list = this.list;

            T.on(list, 'click', this.getListClickDispatcherHandler());
        },

        /**
         * 获取图片列表点击事件分发处理函数
         * 
         * @return {Function}
         * @private
         */
        getListClickDispatcherHandler: function () {
            var me = this;

            return function (e) {
                e = e || window.event;
                var target = T.event.getTarget(e);
                var dataClick = T.dom.getAttr(target, 'data-click');
                var index = me.getIndex(target);

                if (!dataClick) {
                    return;
                }
                // 显示图片放大浮层
                else if ('show-layer' === dataClick) {
                    T.event.preventDefault(e);
                    me.layer.show(index);
                }
                // 删除icon
                else if ('delete' === dataClick) {
                    T.event.preventDefault(e);
                    me.deleteImg(index);
                }
            };
        },

        /**
         * 删除图片
         * 
         * @param {number} index 删除图片的索引
         * @private
         */
        deleteImg: function (index) {
            var list = this.list;
            var dataList = this.dataList;
            var max = this.maxNum;
            var len = dataList.length;
            var pager = this.pager;
            var currentPage = this.currentPage;
            var totalPage = this.totalPage;
            var listIndex = pager ? index - currentPage * max : index;
            var deleteItem = T.dom.children(list)[listIndex];

            T.dom.remove(deleteItem);
            var data = dataList[index];
            dataList.splice(index, 1);

            // 存在分页，且当前不为最后一页,删除时插入下一页第一条数据
            if (pager && currentPage < totalPage - 1) {
                var insertIndex = (currentPage + 1) * max - 1;
                var html = this.getImgHtml(dataList[insertIndex]);
                T.dom.insertHTML(list, 'beforeEnd', html);
            }

            // 若删除之前最后一页只有一条数据，则减少一页
            if (1 === len % max) {
                pager.total--;
                pager.render();
                // 删除动作发生在最后一页，转到新的最末页
                if (currentPage === totalPage - 1) {
                    this.turnToPage(currentPage -1);
                }
                // 总共2页，删除后只有一页，隐藏分页控件
                if (2 === totalPage) {
                    T.dom.hide(pager.main);
                }
                this.totalPage--;
            }

            if (this.ondelete) {
                this.ondelete(data, index);
            }

            if (this.showLayer) {
                this.layer.dataList = dataList;
            }
        },

        /**
         * 根据元素节点获取该元素节点为第几个数据
         * 
         * @param {HTMLElement} ele 节点元素
         * @return {number} index，以0为起点，若参数节点不在列表内，返回null
         * @private
         */
        getIndex: function (ele) {
            var imgItem = ele.tagName.toLowerCase() === 'li'
                ? ele
                : T.dom.getAncestorByTag(ele, 'li');

            if (!imgItem) {
                return null;
            }

            var imgList = T.dom.children(T.dom.getParent(imgItem));
            var currentIndex = T.array.indexOf(imgList, imgItem);
            var index;

            // 无分页时
            if (!this.pager) {
                index = currentIndex;
            }
            // 有分页时
            else {
                index = currentIndex + this.maxNum * this.currentPage;
            }

            return index;
        },

        /**
         * 渲染翻页控件
         * 
         * @private
         */
        renderPager: function () {
            var me = this;
            var pagerDom = T.dom.create('div');
            T.dom.insertAfter(pagerDom, me.list);

            var len = me.dataList.length;
            var max = me.maxNum;
            var total = parseInt(len / max, 10) + (len % max === 0 ? 0 : 1);
            var pager = new Pager({
                main: pagerDom,
                page: 0,
                total: total,
                prefix: 'ui-img-pager'
            });

            pager.on('change', function (e) {
                me.turnToPage(e.page);
            });

            pager.render();

            me.pager = pager;
            me.currentPage = 0;
            me.totalPage = total;
        },

        /**
         * 翻到图片分页列表的第几页
         * 
         * @param {number} page 页数（起点为0）
         * @private
         */
        turnToPage: function (page) {
            var pager = this.pager;
            pager.setPage(page);
            pager.render();
            this.insertImgList(page);
            this.currentPage = page;
        }
    };

    T.extend(ImgList.prototype, proto);

    return ImgList;
});