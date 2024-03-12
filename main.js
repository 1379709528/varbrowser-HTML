const version = '1.49.158495';
require.config({
	urlArgs: `v=${version}`,
	baseUrl: "js/lib"
});

require(['jquery'], function ($) {
	/**
	 * 存储获取数据函数
	 * @function get 存储数据
	 * @function set 获取数据
	 */
	var store = {
		/**
		 * 存储名称为key的val数据
		 * @param {String} key 键值
		 * @param {String} val 数据
		 */
		set: function (key, val) {
			if (!val) {
				return;
			}
			try {
				var json = JSON.stringify(val);
				if (typeof JSON.parse(json) === "object") { // 验证一下是否为JSON字符串防止保存错误
					localStorage.setItem(key, json);
				}
			} catch (e) {
				return false;
			}
		},
		/**
		 * 获取名称为key的数据
		 * @param {String} key 键值
		 */
		get: function (key) {
			if (this.has(key)) {
				return JSON.parse(localStorage.getItem(key));
			}
		},
		has: function (key) {
			if (localStorage.getItem(key)) {
				return true;
			} else {
				return false;
			}
		},
		del: function (key) {
			localStorage.removeItem(key);
		}
	};

	var settingsFn = function (storage) {
		this.storage = { engines: "quark", bookcolor: "black", searchHistory: true };
		this.storage = $.extend({}, this.storage, storage);
	}
	settingsFn.prototype = {
		getJson: function () {
			return this.storage;
		},
		// 读取设置项
		get: function (key) {
			return this.storage[key];
		},
		// 设置设置项并应用
		set: function (key, val) {
			this.storage[key] = val;
			store.set("setData", this.storage);
			this.apply();
		},
		// 应用设置项
		apply: function () {
			var that = this;
			// 加载LOGO
			if (that.get('logo')) {
				$(".logo").html('<img src="icon/logo.png" />');
			} else {
			$(".logo").html('<img src="icon/logo.png" />');
			}
			// 夜间模式 和 壁纸
			var nightMode = {
				on: function () {
					$("body").removeClass('theme-black theme-white').addClass('theme-white');
					$("body").css("background-image", "");
					$("#nightCss").removeAttr('disabled');
				},
				off: function () {
					if (that.get('wallpaper')) {
						$("body").css("background-image", "url(" + that.get('wallpaper') + ")");
					} else {
						$("body").css("background-image", "");
					}
					$("body").removeClass('theme-black theme-white').addClass('theme-' + that.get('bookcolor'));
					$("#nightCss").attr('disabled', true);
				}
			};
			if (that.get('nightMode') === true) {
				nightMode.on();
			} else {
				nightMode.off();
			}
			// 删除掉VIA浏览器夜间模式的暗色支持
			$("head").on("DOMNodeInserted DOMNodeRemoved", function (evt) {
				if (evt.target.id === "via_inject_css_night") {
					if (evt.type === "DOMNodeInserted") {
						$("#via_inject_css_night").html("");
						nightMode.on();
					} else if (evt.type === "DOMNodeRemoved") {
						nightMode.off();
					}
				}
			});
			if ($("#via_inject_css_night").html("").length > 0) {
				nightMode.on();
			}
		}
	}
	var settings = new settingsFn(store.get("setData"));
	settings.apply();

	/**
	 * DOM长按事件
	 */
	$.fn.longPress = function (fn) {
		var timeout = void 0,
			$this = this,
			startPos,
			movePos,
			endPos;
		for (var i = $this.length - 1; i > -1; i--) {
			$this[i].addEventListener("touchstart", function (e) {
				var touch = e.targetTouches[0];
				startPos = { x: touch.pageX, y: touch.pageY };
				timeout = setTimeout(function () {
					if ($this.attr("disabled") === undefined) {
						fn();
					}
				}, 700);
			}, { passive: true });
			$this[i].addEventListener("touchmove", function (e) {
				var touch = e.targetTouches[0];
				movePos = { x: touch.pageX - startPos.x, y: touch.pageY - startPos.y };
				(Math.abs(movePos.x) > 10 || Math.abs(movePos.y) > 10) && clearTimeout(timeout);
			}, { passive: true });
			$this[i].addEventListener("touchend", function () {
				clearTimeout(timeout);
			}, { passive: true });
		}
	};

	/**
	 * 文件打开函数
	 * @param callback 回调函数
	 */
	var openFile = function (callback) {
		$('.openFile').remove();
		var input = $('<input class="openFile" type="file">');
		input.on("propertychange change", callback);
		$('body').append(input);
		input.click();
	}

	/**
	 * 文件上传函数
	 * @param file 文件
	 * @param callback 回调函数 
	 */
	var uploadFile = function (file, callback) {
		var imageData = new FormData();
		imageData.append("file", file);
		$.ajax({
			url: 'https://apis.yum6.cn/api/5bd90750c3f77?token=f07b711396f9a05bc7129c4507fb65c5',
			type: 'POST',
			data: imageData,
			cache: false,
			contentType: false,
			processData: false,
			dataType: 'json',
			success: function (res) {
				if (res.code == 1) {
					callback.success && callback.success('https://ps.ssl.qhmsg.com' + res.data.substr(res.data.lastIndexOf("/")));
				} else {
					callback.error && callback.error(res.msg);
				}
			},
			error: function () {
				callback.error && callback.error('请求失败！');
			},
			complete: function () {
				callback.complete && callback.complete();
			}
		});
	}

	/**
	 * 首页书签构建函数
	 * @function init 初始化
	 * @function bind 绑定事件
	 * @function del 删除书签
	 * @function add 添加书签
	 */
	var bookMarkFn = function (ele, options) {
		this.$ele = $(ele);
		this.options = {
			data: [{ "name": "书签", "url": "cbapi:BookMark", "icon": "icon/bkm.png" }, { "name": "谷歌", "url": "https://www.google.com.hk", "icon": "icon/google.png" }, { "name": "微博", "url": "https://weibo.com", "icon": "icon/weibo.png" }, { "name": "Bilibili", "url": "https://m.bilibili.com", "icon": "icon/bilibilibog.png" }, { "name": "知乎", "url": "https://www.zhihu.com", "icon": "icon/zhihu.png" }, { "name": "淘宝", "url": "https://m.taobao.com", "icon": "icon/taobao.png" }, { "name": "贴吧", "url": "https://tieba.baidu.com", "icon": "icon/tieba.png" }, { "name": "网易", "url": "https://3g.163.com", "icon": "icon/netease.png" }, { "name": "脸书", "url": "https://www.facebook.com", "icon": "icon/f.png" }, { "name": "推特", "url": "https://www.twitter.com", "icon": "icon/t.png" }],
		};
		this.options = $.extend({}, this.options, options);
		this.init();
	}
	bookMarkFn.prototype = {
		init: function () {
			var html = '';
			var data = this.options.data;
			for (var i = 0, l = data.length; i < l; i++) {
				html += '<div class="list" data-url="' + data[i].url + '"><div class="img" style="background-image:url(' + data[i].icon + ')"></div><div class="text">' + data[i].name + "</div></div>";
			}
			this.$ele.html(html);
			this.bind();
		},
		getJson: function () {
			return this.options.data;
		},
		bind: function () {
			var that = this;
			var data = this.options.data;
			// 绑定书签长按事件
			this.$ele.longPress(function () {
				if (that.status !== "editing" && data.length > 0) {
					that.status = "editing";
					$('.addbook').remove();
					require(['jquery-sortable'], function () {
						that.$ele.sortable({
							animation: 150,
							fallbackTolerance: 3,
							touchStartThreshold: 3,
							ghostClass: "ghost",
							onEnd: function (evt) {
								var startID = evt.oldIndex,
									endID = evt.newIndex;
								if (startID > endID) {
									data.splice(endID, 0, data[startID]);
									data.splice(startID + 1, 1);
								} else {
									data.splice(endID + 1, 0, data[startID]);
									data.splice(startID, 1);
								}
								store.set("bookMark", data);
							}
						});
					})
					$(document).click(function () {
						$(document).unbind("click");
						$(".delbook").addClass("animation");
						$(".delbook").on('transitionend', function (evt) {
							if (evt.target !== this) {
								return;
							}
							$(".delbook").remove();
							that.$ele.sortable("destroy");
							that.status = "";
						});
					});
					var $list = that.$ele.find(".list");
					for (var i = $list.length; i > -1; i--) {
						$list.eq(i).find(".img").prepend('<div class="delbook"></div>');
					}
				}
			});
			this.$ele.on('click', function (evt) {
				if (evt.target !== this || that.status === 'editing' || $('.addbook').hasClass('animation') || data.length >= 20) {
					return;
				}
				if ($('.addbook').length === 0) {
					that.$ele.append('<div class="list addbook"><div class="img"><svg viewBox="0 0 1024 1024"><path d="M736.1 480.2H543.8V287.9c0-17.6-14.4-32-32-32s-32 14.4-32 32v192.2H287.6c-17.6 0-32 14.4-32 32s14.4 32 32 32h192.2v192.2c0 17.6 14.4 32 32 32s32-14.4 32-32V544.2H736c17.6 0 32-14.4 32-32 0.1-17.6-14.3-32-31.9-32z" fill="#555"></path></svg></div></div>');
					$('.addbook').click(function () {
						$('.addbook').remove();
						// 取消书签编辑状态
						$(document).click();
						// 插入html
						$('#app').append(`<div class="page-bg"></div>
						<div class="page-addbook">
							<ul class="addbook-choice">
								<li class="current">站点</li>
								<!-- <li>书签</li>
								<li>历史</li> -->
								<span class="active-span"></span>
							</ul>
							<div class="addbook-content">
								<div class="addbook-sites">
								<input type="text" class="addbook-input addbook-url" placeholder="输入网址" value="http://" />
								<input type="text" class="addbook-input addbook-name" placeholder="输入网站名" />
									<div id="addbook-upload">点击选择图标</div>
									<div class="addbook-ok">确认添加</div>
								</div>
								<div class="bottom-close"></div>
							</div>
						</div>`);

						setTimeout(function () {
							$(".page-bg").addClass("animation");
							$(".addbook-choice").addClass("animation");
							$(".addbook-content").addClass("animation");
						}, 50);

						//绑定事件
						$("#addbook-upload").click(function () {
							openFile(function () {
								var file = this.files[0];
								$("#addbook-upload").html('上传图标中...').css("pointer-events", "none");
								$(".addbook-ok").css("pointer-events", "none");
								uploadFile(file, {
									success: function (url) {
										$("#addbook-upload").html('<img src="' + url + '"></img><p>' + file.name + '</p>');
									},
									error: function (msg) {
										$("#addbook-upload").html('上传图标失败！' + msg);
									},
									complete: function () {
										$("#addbook-upload").css("pointer-events", "");
										$(".addbook-ok").css("pointer-events", "");
									}
								})
							});
						});
						$(".addbook-ok").click(function () {
							var name = $(".addbook-name").val(),
								url = $(".addbook-url").val(),
								icon = $("#addbook-upload img").attr("src");
							if (name.length && url.length) {
								if (!icon) {
									// 绘制文字图标
									var canvas = document.createElement("canvas");
									canvas.height = 100;
									canvas.width = 100;
									var ctx = canvas.getContext("2d");
									ctx.fillStyle = "#f5f5f5";
									ctx.fillRect(0, 0, 100, 100);
									ctx.fill();
									ctx.fillStyle = "#222";
									ctx.font = "40px Arial";
									ctx.textAlign = "center";
									ctx.textBaseline = "middle";
									ctx.fillText(name.substr(0, 1), 50, 52);
									icon = canvas.toDataURL("image/png");
								}
								$(".bottom-close").click();
								bookMark.add(name, url, icon);
							}
						});
						$(".bottom-close").click(function () {
							$(".page-addbook").css({ "pointer-events": "none" });
							$(".page-bg").removeClass("animation");
							$(".addbook-choice").removeClass("animation");
							$(".addbook-content").removeClass("animation");
							setTimeout(function () {
								$(".page-addbook").remove();
								$(".page-bg").remove();
							}, 300);
						});
						$(".page-addbook").click(function (evt) {
							if (evt.target === evt.currentTarget) {
								$(".bottom-close").click();
							}
						});

					})
				} else {
					$(".addbook").addClass("animation");
					setTimeout(function () {
						$(".addbook").remove();
					}, 400);
				}
			});
			this.$ele.on('click', '.list', function (evt) {
				evt.stopPropagation();
				var dom = $(evt.currentTarget);
				if (that.status !== "editing") {
					var url = dom.data("url");
					if (url) {
						switch (url) {
							case "choice()":
								choice();
								break;
							default:
								location.href = url;
						}
					}
				} else {
					if (evt.target.className === "delbook") {
						that.del(dom.index());
					}
				}
			});
		},
		del: function (index) {
			var that = this;
			var data = this.options.data;
			this.$ele.css("overflow", "visible");
			var dom = this.$ele.find('.list').eq(index);
			dom.css({ transform: "translateY(60px)", opacity: 0, transition: ".3s" });
			dom.on('transitionend', function (evt) {
				if (evt.target !== this) {
					return;
				}
				dom.remove();
				that.$ele.css("overflow", "hidden");
			});
			data.splice(index, 1);
			store.set("bookMark", data);
		},
		add: function (name, url, icon) {
			var data = this.options.data;
			url = url.match(/:\/\//) ? url : "http://" + url;
			var i = data.length - 1;
			var dom = $('<div class="list" data-url="' + url + '"><div class="img" style="background-image:url(' + icon + ')"></div><div class="text">' + name + '</div></div>');
			this.$ele.append(dom);
			dom.css({ marginTop: "60px", opacity: "0" }).animate({ marginTop: 0, opacity: 1 }, 300);
			data.push({ name: name, url: url, icon: icon });
			store.set("bookMark", data);
		}
	}

	/**
	 * 搜索历史构建函数
	 * @function init 初始化
	 * @function load 加载HTML
	 * @function bind 绑定事件
	 * @function add 添加历史
	 * @function empty 清空历史
	 */
	var searchHistoryFn = function (ele, options) {
		this.$ele = $(ele);
		this.options = {
			data: []
		};
		this.options = $.extend({}, this.options, options);
		this.init();
	}
	searchHistoryFn.prototype = {
		init: function () {
			this.options.data = this.options.data.slice(0, 10);
			this.load();
			this.bind();
		},
		load: function () {
			var data = this.options.data;
			var html = '';
			var l = data.length;
			for (var i = 0; i < l; i++) {
				html += '<li>' + data[i] + '</li>';
			}
			this.$ele.find('.content').html(html);
			l ? $('.emptyHistory').show() : $('.emptyHistory').hide();
		},
		bind: function () {
			var that = this;
			// 监听touch事件，防止点击后弹出或收回软键盘
			$('.emptyHistory')[0].addEventListener("touchstart", function (e) {
				e.preventDefault();
			}, false);
			$('.emptyHistory')[0].addEventListener("touchend", function (e) {
				if ($('.emptyHistory').hasClass('animation')) {
					that.empty();
				} else {
					$('.emptyHistory').addClass('animation');
				}
			}, false);
			this.$ele.click(function (evt) {
				if (evt.target.nodeName === "LI") {
					$('.search-input').val(evt.target.innerText).trigger("propertychange");
					$('.search-btn').click();
				}
			});
		},
		add: function (text) {
			var data = this.options.data;
			if (settings.get('searchHistory') === true) {
				var pos = data.indexOf(text);
				if (pos !== -1) {
					data.splice(pos, 1);
				}
				data.unshift(text);
				this.load();
				store.set("history", data);
			}
		},
		empty: function () {
			this.options.data = [];
			store.set("history", []);
			this.load();
		}
	}

	// 开始构建
	var bookMark = new bookMarkFn($('.bookmark'), { data: store.get("bookMark") })
	var searchHistory = new searchHistoryFn($('.history'), { data: store.get("history") });

	/**
	 * 更改地址栏URL参数
	 * @param {string} param 参数
	 * @param {string} value 值
	 * @param {string} url 需要更改的URL,不设置此值会使用当前链接
	 */
	var changeParam = function (param, value, url) {
		url = url || location.href;
		var reg = new RegExp("(^|)" + param + "=([^&]*)(|$)");
		var tmp = param + "=" + value;
		return url.match(reg) ? url.replace(eval(reg), tmp) : url.match("[?]") ? url + "&" + tmp : url + "?" + tmp;
	};

	// 更改URL，去除后面的参数
	history.replaceState(null, document.title, location.origin + location.pathname);

	// 绑定主页虚假输入框点击事件
	$(".ornament-input-group").click(function () {
		$('body').css("pointer-events", "none");
		history.pushState(null, document.title, changeParam("page", "search"));
		// 动画输入框复合
		$('.anitInput').remove();
		var ornamentInput = $(".ornament-input-group");
		var top = ornamentInput.offset().top;
		var left = ornamentInput.offset().left;
		var anitInput = ornamentInput.clone();
		anitInput.attr('class', 'anitInput').css({
			'position': 'absolute',
			'top': top,
			'left': left,
			'width': ornamentInput.outerWidth(),
			'height': ornamentInput.outerHeight(),
			'pointer-events': 'none'
		})
		$('body').append(anitInput);
		ornamentInput.css('opacity', 0);
		if ($(window).data('anitInputFn')) {
			$(window).unbind('resize', $(window).data('anitInputFn'));
		}
		var anitInputFn = function () {
			var inputBg = $('.input-bg');
			var scaleX = inputBg.outerWidth() / ornamentInput.outerWidth();
			var scaleY = inputBg.outerHeight() / ornamentInput.outerHeight();
			var translateX = inputBg.offset().left - left - (ornamentInput.outerWidth() - inputBg.outerWidth()) / 2;
			var translateY = inputBg.offset().top - top - (ornamentInput.outerHeight() - inputBg.outerHeight()) / 2;
			anitInput.css({
				'transform': 'translateX(' + translateX + 'px) translateY(' + translateY + 'px) scale(' + scaleX + ',' + scaleY + ') translate3d(0,0,0)',
				'transition': '.3s'
			});
			anitInput.addClass("animation");
		}
		$(window).data('anitInputFn', anitInputFn);
		$(window).bind('resize', anitInputFn);
		// 弹出软键盘
		$(".s-temp").focus();
		// 书签动画
		$(".bookmark").addClass("animation");
		// 显示搜索页
		$(".page-search").show();
		setTimeout(function () {
			$(".page-search").on('transitionend', function (evt) {
				if (evt.target !== this) {
					return;
				}
				$(".page-search").off('transitionend');
				$('body').css("pointer-events", "");
			}).addClass("animation");
			$(".search-input").val("").focus();
			$(".history").show().addClass("animation");
			$(".input-bg").addClass("animation");
			$(".shortcut").addClass("animation");
		}, 1);
	});

	$(".page-search").click(function (evt) {
		if (evt.target === evt.currentTarget) {
			history.go(-1);
		}
	});

	// 返回按键被点击
	window.addEventListener("popstate", function () {
		if ($('.page-search').is(":visible")) {
			$('body').css("pointer-events", "none");
			history.replaceState(null, document.title, location.origin + location.pathname);
			// 动画输入框分离
			$(window).unbind('resize', $(window).data('anitInputFn'));
			var anitInput = $('.anitInput');
			anitInput.css({
				'transform': '',
				'transition': '.3s'
			});
			anitInput.removeClass("animation");
			// 书签动画
			$(".bookmark").removeClass("animation");
			// 隐藏搜索页
			$(".history").removeClass("animation");
			$(".input-bg").removeClass("animation");
			$(".shortcut").removeClass("animation");
			$(".page-search").removeClass("animation");
			$(".page-search").on('transitionend', function (evt) {
				if (evt.target !== this) {
					return;
				}
				$(".page-search").off('transitionend');
				$(".page-search").hide();
				$('.ornament-input-group').css({ 'transition': 'none', 'opacity': '' });
				anitInput.remove();
				// 搜索页内容初始化
				$(".suggestion").html("");
				$(".search-btn").html("取消");
				$(".shortcut1").show();
				$(".shortcut2,.shortcut3,.empty-input").hide();
				$(".search-input").val('');
				$('.emptyHistory').removeClass('animation');
				$('body').css("pointer-events", "");
			});
		}
	}, false);

	$(".suggestion").click(function (evt) {
		if (evt.target.nodeName === "SPAN") {
			$('.search-input').focus().val($(evt.target).parent().text()).trigger("propertychange");
			return;
		} else {
			searchText(evt.target.innerText);
		}
	});

	$(".search-input").on("input propertychange", function () {
		var that = this;
		var wd = $(that).val();
		$(".shortcut1,.shortcut2,.shortcut3").hide();
		if (!wd) {
			$(".history").show();
			$(".empty-input").hide();
			$(".search-btn").html("取消");
			$(".shortcut1").show();
			$(".suggestion").hide().html('');
		} else {
			$(".history").hide();
			$(".empty-input").show();
			$(".search-btn").html(/^\b(((https?|ftp):\/\/)?[-a-z0-9]+(\.[-a-z0-9]+)*\.(?:com|net|org|int|edu|gov|mil|arpa|asia|biz|info|name|pro|coop|aero|museum|[a-z][a-z]|((25[0-5])|(2[0-4]\d)|(1\d\d)|([1-9]\d)|\d))\b(\/[-a-z0-9_:\@&?=+,.!\/~%\$]*)?)$/i.test(wd) ? "进入" : "搜索");
			escape(wd).indexOf("%u") < 0 ? $(".shortcut2").show() : $(".shortcut3").show();
			$.ajax({
				url: "https://suggestion.baidu.com/su",
				type: "GET",
				dataType: "jsonp",
				data: { wd: wd, cb: "sug" },
				timeout: 5000,
				jsonpCallback: "sug",
				success: function (res) {
					if ($(that).val() !== wd) {
						return;
					}
					var data = res.s;
					var isStyle = $(".suggestion").html();
					var html = "";
					for (var i = data.length; i > 0; i--) {
						var style = "";
						if (isStyle === "") {
							style = "animation: fadeInDown both .5s " + (i - 1) * 0.05 + 's"';
						}
						html += '<li style="' + style + '"><div>' + data[i - 1].replace(wd, '<b>' + wd + '</b>') + "</div><span></span></li>";
					}
					$(".suggestion").show().html(html).scrollTop($(".suggestion")[0].scrollHeight);
				}
			});
			$.ajax({
				url: "https://quark.sm.cn/api/qs",
				type: "GET",
				dataType: "jsonp",
				data: { query: wd },
				timeout: 5000,
				success: function (res) {
					if ($(that).val() !== wd) {
						return;
					}
					var data = res.data;
					var html = '<li>快搜:</li>';
					for (var i = 0, l = data.length; i < l; i++) {
						html += '<li>' + data[i] + '</li>';
					}
					$('.shortcut3').html(html);
				}
			});
		}
	});

	$(".empty-input").click(function () {
		$(".search-input").focus().val("").trigger("propertychange");
	});

	$(".shortcut1,.shortcut2").click(function (evt) {
		$(".search-input").focus().val($(".search-input").val() + evt.target.innerText).trigger("propertychange");
	});

	$(".shortcut3").click(function (evt) {
		if (evt.target.nodeName === "LI") {
			var text = evt.target.innerText;
			var data = {
				百科: "https://baike.baidu.com/search?word=%s",
				视频: "https://m.v.qq.com/search.html?act=0&keyWord=%s",
				豆瓣: "https://m.douban.com/search/?query=%s",
				新闻: "http://m.toutiao.com/search/?&keyword=%s",
				图片: "https://m.baidu.com/sf/vsearch?pd=image_content&word=%s&tn=vsearch&atn=page",
				微博: "https://m.weibo.cn/search?containerid=100103type=1&q=%s",
				音乐: "http://m.music.migu.cn/v3/search?keyword=%s",
				知乎: "https://www.zhihu.com/search?q=%s",
				小说: "https://m.qidian.com/search?kw=%s",
				旅游: "https://h5.m.taobao.com/trip/rx-search/list/index.html?&keyword=%s",
				地图: "https://m.amap.com/search/mapview/keywords=%s",
				电视剧: "http://m.iqiyi.com/search.html?key=%s",
				股票: "https://emwap.eastmoney.com/info/search/index?t=14&k=%s",
				汽车: "https://sou.m.autohome.com.cn/zonghe?q=%s"
			}
			if (data[text]) {
				location.href = data[text].replace("%s", $(".search-input").val());
			}
		}
	});

	$(".search-btn").click(function () {
		var text = $(".search-input").val();
		if ($(".search-btn").text() === "进入") {
			!text.match(/^(ht|f)tp(s?):\/\//) && (text = "http://" + text);
			history.go(-1);
			setTimeout(function () {
				location.href = text;
			}, 1);
		} else {
			if (!text) {
				$(".search-input").blur();
				history.go(-1);
			} else {
				searchText(text);
			}
		}
	});

	$(".search-input").keydown(function (evt) {
		// 使用回车键进行搜索
		evt.keyCode === 13 && $(".search-btn").click();
	});

	// 识别浏览器
	var browserInfo = function () {
		if (window.via) {
			return 'via';
		} else if (window.mbrowser) {
			return 'x';
		}
	};

	// 搜索函数
	function searchText(text) {
		if (!text) {
			return;
		}
		searchHistory.add(text);
		history.go(-1);
		setTimeout(function () { // 异步执行 兼容QQ浏览器
			if (settings.get('engines') === "via") {
				window.via.searchText(text);
			} else {
				location.href = {
					baidu: "https://m.baidu.com/s?wd=%s",
					quark: "https://quark.sm.cn/s?q=%s",
					google: "https://www.google.com/search?q=%s",
					bing: "https://cn.bing.com/search?q=%s",
					sm: "https://m.sm.cn/s?q=%s",
					haosou: "https://m.so.com/s?q=%s",
					sogou: "https://m.sogou.com/web/searchList.jsp?keyword=%s",
					diy: settings.get('diyEngines')
				}[settings.get('engines')].replace("%s", text);
			}
		}, 1);
	}

	//精选页面
	

	$(".logo").click(() => {
		var browser = browserInfo();
		if (browser === 'via') {
			location.href = "folder://";
		} else if (browser === 'x') {
			location.href = "x:bm?sort=default";
		}
	}).click(() => {
		var data = [{ "title": "全部设置", "value": "openurl2" }, { "type": "hr" }, { "title": "搜索引擎", "type": "select", "value": "engines", "data": [{ "t": "夸克搜索", "v": "quark" }, { "t": "跟随Via浏览器", "v": "via" }, { "t": "百度搜索", "v": "baidu" }, { "t": "谷歌搜索", "v": "google" }, { "t": "必应搜索", "v": "bing" }, { "t": "神马搜索", "v": "sm" }, { "t": "好搜搜索", "v": "haosou" }, { "t": "搜狗搜索", "v": "sogou" }, { "t": "自定义", "v": "diy" }] }, { "title": "设置壁纸", "value": "wallpaper" }, { "title": "恢复默认壁纸", "value": "delLogo" }, { "title": "图标颜色", "type": "select", "value": "bookcolor", "data": [{ "t": "深色图标", "v": "black" }, { "t": "浅色图标", "v": "white" }] }, { "title": "记录搜索历史", "type": "checkbox", "value": "searchHistory" }, { "type": "hr" }, { "title": "导出主页数据", "value": "export" }, { "title": "导入主页数据", "value": "import" } ];
		var html = '<div class="page-settings"><div class="set-header"><div class="set-back"></div><p class="set-logo">主页设置</p></div><ul class="set-option-from">';
		for (var json of data) {
			if (json.type === 'hr') {
				html += `<li class="set-hr"></li>`;
			} else {
				html += `<li class="set-option" ${json.value ? `data-value="${json.value}"` : ''}>
							<div class="set-text">
								<p class="set-title">${json.title}</p>
								${json.description ? `<div class="set-description">${json.description}</div>` : ''}
							</div>`;
				if (json.type === 'select') {
					html += `<select class="set-select">`;
					for (var i of json.data) {
						html += `<option value="${i.v}">${i.t}</option>`;
					}
					html += `</select>`;
				} else if (json.type === 'checkbox') {
					html += `<input type="checkbox" class="set-checkbox" autocomplete="off"><label></label>`;
				}
				html += `</li>`;
			}
		}
		html += '</ul></div>';
		$('#app').append(html);

		$(".page-settings").show();
		$(".page-settings").addClass('animation');

		var browser = browserInfo();
		if (browser !== 'via') { // 只有VIA浏览器才能显示
			$('option[value=via]').hide();
		}

		$(".set-option .set-select").map(function () {
			$(this).val(settings.get($(this).parent().data('value')));
		});

		$(".set-option .set-checkbox").map(function () {
			$(this).prop("checked", settings.get($(this).parent().data('value')));
		});

		$(".set-back").click(function () {
			$(".page-settings").css("pointer-events", "none").removeClass("animation");
			$(".page-settings").on('transitionend', function (evt) {
				if (evt.target !== this) {
					return;
				}
				$(".page-settings").remove();
			});
		});

		$(".set-option").click(function (evt) {
			var $this = $(this);
			var value = $this.data("value");
			if (value === "wallpaper") {
				openFile(function () {
					var file = this.files[0];
					$this.css("pointer-events", "none");
					$this.find('.set-title').text('壁纸上传中...');
					uploadFile(file, {
						success: function (url) {
							settings.set('wallpaper', url);
							alert('壁纸上传成功！');
						},
						error: function (msg) {
							alert('壁纸上传失败，请重试。错误信息：' + msg);
						},
						complete: function () {
							$this.find('.set-title').text('壁纸');
							$this.css("pointer-events", "");
						}
					});
				});
			} else if (value === "delLogo") {
				settings.set('wallpaper', '');
				settings.set('logo', '');
				settings.set('bookcolor', 'black');
				location.reload();
			} else if (value === "openurl") {
				open($this.find('.set-description').text());
				} else if (value === "openurl2") {
				open("cbapi:Settings");
			} else if (value === "export") {
				var oInput = $('<input>');
				oInput.val('{"bookMark":' + JSON.stringify(bookMark.getJson()) + ',"setData":' + JSON.stringify(settings.getJson()) + '}');
				document.body.appendChild(oInput[0]);
				console.log(store.get('bookMark'));
				oInput.select();
				document.execCommand("Copy");
				alert('已复制到剪贴板，请粘贴保存文件。');
				oInput.remove();
			} else if (value === "import") {
				var data = prompt("在这里粘贴主页数据");
				try {
					data = JSON.parse(data);
					store.set("bookMark", data.bookMark);
					store.set("setData", data.setData);
					alert("导入成功!");
					location.reload();
				} catch (e) {
					alert("导入失败!");
				}
			} else if (evt.target.className !== 'set-select' && $this.find('.set-select').length > 0) {
				$.fn.openSelect = function () {
					return this.each(function (idx, domEl) {
						if (document.createEvent) {
							var event = document.createEvent("MouseEvents");
							event.initMouseEvent("mousedown", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
							domEl.dispatchEvent(event);
						} else if (element.fireEvent) {
							domEl.fireEvent("onmousedown");
						}
					});
				}
				$this.find('.set-select').openSelect();
			} else if (evt.target.className !== 'set-checkbox' && $this.find('.set-checkbox').length > 0) {
				$this.find('.set-checkbox').prop("checked", !$this.find('.set-checkbox').prop("checked")).change();
			}
		});

		$(".set-select").change(function () {
			var dom = $(this),
				item = dom.parent().data("value"),
				value = dom.val();
			if (item === "engines" && value === "diy") {
				var engines = prompt("输入搜索引擎网址，（用“%s”代替搜索字词）");
				console.log(engines);
				if (engines) {
					settings.set('diyEngines', engines);
				} else {
					dom.val(settings.get('engines'));
					return false;
				}
			}
			// 保存设置
			settings.set(item, value);
		});

		$(".set-checkbox").change(function () {
			var dom = $(this),
				item = dom.parent().data("value"),
				value = dom.prop("checked");
			// 保存设置
			settings.set(item, value);
		});

	});

	// 下滑进入搜索
	require(['touchSwipe'], function () {
		$(".page-home").swipe({
			swipeStatus: function (event, phase, direction, distance, duration, fingerCount, fingerData) {
				if ($('.delbook').length !== 0) {
					return;
				}
				if (phase === 'start') {
					this.height = $(document).height();
				} else if (phase === 'move') {
					var sliding = Math.max(fingerData[0].end.y - fingerData[0].start.y, 0);
					$('.logo').attr("disabled", true).css({ 'opacity': 1 - (sliding / this.height) * 4, 'transition': 'none' });
					$('.ornament-input-group').css({ 'transform': 'translate3d(0,' + Math.min((sliding / this.height) * 50, 30) + 'px,0)', 'transition': 'none' });
					$('.bookmark').attr("disabled", true).css({ 'opacity': 1 - (sliding / this.height) * 4, 'transform': 'scale(' + (1 - (sliding / this.height) * .3) + ')', 'transition': 'none' });
				} else if (phase === 'end' || phase === 'cancel') {
					$('.logo').removeAttr("disabled style");
					$('.bookmark').removeAttr("disabled style");
					if (distance >= 100 && direction === "down") {
						$('.ornament-input-group').css("transform", "").click();
						$('.logo').css('opacity', '0');
						$('.bookmark').css('opacity', '0');
						$('.anitInput').addClass('animation');
						setTimeout(function () {
							$('.logo').css('opacity', '');
							$('.bookmark').css('opacity', '');
						}, 300);
					} else {
						$('.ornament-input-group').removeAttr("style");
					}
				}
			}
		});
	})

})