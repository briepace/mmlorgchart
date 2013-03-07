(function($) {
	var MMLOrgChart = function(element, options) {
		var debug = true;
		var stacktrace = true;
		var m_elem = $(element);
		var m_obj = this;
		var m_data = undefined;
		var m_parsedData = {};
		var m_root;
		var m_maxTreeDepth = 0;

		// Used to keep track of how far right to draw nodes(minimum).
		var m_levelPositions = new Object();
		var m_levelNodes = new Object();
		var m_levelHeight = 100;
		var m_edgeSpacing = 20;
		var m_verticalSpacing = 50;

		var m_drawnNodes = new Array();

		var m_nodeStyle = 'text-align:center; border: 1px solid black;' +
							' min-height: 75px; font-size: .8em; font-family: Arial,sans-serif;' +
							' padding-left: 10px; padding-right: 10px; display: table-cell;' +
							' cursor: default;';
		var m_titleStyle = 'font-weight: bold; margin-top: 5px;';
		var m_nodeClass = 'mmloc_node';
		var m_parentStyle = '';

		var m_nodesMoved = false;

		var m_settings = $.extend({
			param: 'devaultValue'
		}, options || {});



		/*
		 *  Assign data for MMLOrgChart to use.
		 */
		this.data = function(d) {
			m_data = d;
			initData();
			createTreeFromData();
			return this;
		};

		this.setCSSNodeClass = function(c) {
			m_nodeClass = c;
			return this;
		};

		this.addCSSNodeClass = function(c) {
			m_nodeClass = m_nodeClass + ' ' + c;
			return this;
		};

		// All parent nodes will get this style.
		this.setParentStyle = function(s) {
			m_parentStyle = s;
			return this;
		}

		// Make sure all nodes have an ID.
		var initData = function() {
			for(var i in m_data) {
				if(m_data[i].id == undefined || m_data[i].id == null) {
					m_data[i].id = m_data[i].name.replace(' ', '').toLowerCase();
				}
			}
		}

		/*
		 *  Creates tree structure from data.
		 */
		var createTreeFromData = function() {
			//Make it easy to find nodes by referencing them by ID.
			for(var d in m_data) {
				var id = m_data[d].id;
				if(m_data[d].cssClass == undefined || m_data[d].cssClass == null)
					m_data[d].cssClass = '';
				if(m_data[d].cssStyle == undefined || m_data[d].cssStyle == null)
					m_data[d].cssStyle = '';

				m_parsedData = $.extend(m_parsedData, $.parseJSON("{\"" + id + "\":\"hey\"}"));
				m_parsedData[id] = m_data[d];
			}

			//Create tree structure(s).
			for(var id in m_parsedData) {
				var super_id = m_parsedData[id].super;
				if(super_id != null && super_id != undefined) {
					m_parsedData[id].parent = m_parsedData[super_id];
					if(m_parsedData[super_id].children == null || m_parsedData[super_id].children == undefined)
						m_parsedData[super_id].children = new Array();
					m_parsedData[super_id].children.push(m_parsedData[id]);
				}
			}

			//Move tree root to m_root.
			for(var id in m_parsedData) {
				if(m_parsedData[id].super == null || m_parsedData[id].super == undefined) {
					m_root = m_parsedData[id];
					break;
				}
			}

			findMaxTreeDepth(m_root);

		};

		var findMaxTreeDepth = function(root, depth) {
			//Default depth = 0
			depth = typeof depth !== 'undefined' ? depth : 0;
			if((root.children != undefined || root.children != null) && root.children.length > 0) {
				for(var i in root.children) {
					findMaxTreeDepth(root.children[i], depth + 1);
				}
			}
			else {
				if(depth > m_maxTreeDepth)
					m_maxTreeDepth = depth;
			}
		};

		this.render = function() {

			$('head').prepend('<style type="text/css">.mmloc_node {' + m_nodeStyle + '}</style>');

			drawNode(m_root, 0);
			callRepositionNodes();
			drawConnection(m_root);

			var container_height = parseInt(m_elem.height());
			console.log(m_elem.height() + ':' + container_height);
			for(var i in m_drawnNodes) {
				var node = $('#mmloc_'+m_elem.attr('id')+'_'+m_drawnNodes[i]);
				if((parseInt(node.css('top').replace('px','')) + node.height()) > container_height)
					container_height = parseInt(node.css('top').replace('px','')) + node.height();
			}
			m_elem.height(container_height);
			m_elem.css('position','relative');
			
		};

		var getChildlessChildren = function(node, depth) {
			children = new Array();
			for(var i in node.children) {
				if(node.children[i].children == undefined || node.children[i].children == null)
					children.push(node.children[i]);
			}
			return children;
		}

		var drawNode = function(node, depth) {

			if((node.children != undefined || node.children != null) && node.children.length > 0) {
				var childless_children = getChildlessChildren(node);

				var parent = node.parent;
				for(var i in childless_children) {
					var child = childless_children[i];

					child.vertical = true;
					if(childless_children.length == node.children.length)
						child.childless_siblings = true;
					else
						child.childless_siblings = false;
					var node_classes = (child.cssClass == '' ? m_nodeClass : (m_nodeClass+' '+child.cssClass));
					var node_style = (child.cssStyle == '' ? '' : (' style="'+child.cssStyle+'" '));
					var str = '<div id="mmloc_'+m_elem.attr('id')+'_'+child.id+'" class="' + node_classes + '"' + node_style + '>' +
							'<p style="' + m_titleStyle + '">' + child.title.replace(/ /g, '&nbsp;') + '</p>' +
							child.name.replace(/ /g, '&nbsp;') + '</div>';
					m_elem.append(str);
					m_drawnNodes.push(child.id);
				}

				// Get max width among children.
				var width = 0;
				for(var i in childless_children) {
					var child = childless_children[i];
					var elem = $('#mmloc_'+m_elem.attr('id')+'_'+child.id);

					elem.css('float','left');
					var tempWidth = elem.width();
					if(tempWidth > width)
						width = tempWidth;
				}

				var posLeft = 0;
				for(var k = depth; k < depth+childless_children.length; k++) {
					if(m_levelPositions[k] == undefined || m_levelPositions[k] == null) {
						m_levelPositions[k] = m_edgeSpacing + m_verticalSpacing;
						tempPosLeft = m_edgeSpacing + m_verticalSpacing;
					}
					else
						tempPosLeft = m_levelPositions[k] + m_verticalSpacing;
					if(tempPosLeft > posLeft)
						posLeft = tempPosLeft;
				}
				
				var curDepth = depth + 1;
				for(var i in childless_children) {
					var child = childless_children[i];
					var elem = $('#mmloc_'+m_elem.attr('id')+'_'+child.id);

					elem.css('float','left');
					elem.width(width);
					var posTop = curDepth * m_levelHeight + m_edgeSpacing;
					elem.css('float', '');
					elem.css('position','absolute');
					elem.css('top', posTop);
					elem.css('left', posLeft);
					m_levelPositions[curDepth] = posLeft + width + 2*m_edgeSpacing;

					if(m_levelNodes[curDepth] == undefined || m_levelNodes[curDepth] == null)
						m_levelNodes[curDepth] = new Array();

					m_levelNodes[curDepth].push(child);
					curDepth += 1;
				}

				

				for(var i in node.children) {
					if($.inArray(node.children[i].id, m_drawnNodes) == -1)
						drawNode(node.children[i], depth + 1);
				}
			}

			if($.inArray(node.id, m_drawnNodes) != -1)
				return;

			if((node.children != undefined && node.children != null && node.children.length > 0) || !checkSiblingsForChildren(node)) {
				if(m_levelNodes[depth] == undefined || m_levelNodes[depth] == null)
					m_levelNodes[depth] = new Array();

				m_levelNodes[depth].push(node);
				node.vertical = false;
				var id = 'mmloc_'+m_elem.attr('id')+'_' + node.id;
				var node_classes = (node.cssClass == '' ? m_nodeClass : (m_nodeClass+' '+node.cssClass));
				if(node.children != undefined && node.children != null && node.children.length > 0) {
					var node_style = node.cssStyle + ' ' + m_parentStyle;
				} else {
					var node_style = node.cssStyle;
				}
				var str = '<div id="' + id + '" class="' + node_classes + '" style="' + node_style + '">' +
							'<p style="' + m_titleStyle + '">' + node.title.replace(/ /g, '&nbsp;') + '</p>' +
							node.name.replace(/ /g, '&nbsp;') + '</div>';
				m_elem.append(str);
				m_drawnNodes.push(node.id);


				var elem = $('#' + id);
				elem.css('float', 'left');
				var width = elem.width();
				var posTop = depth * m_levelHeight + m_edgeSpacing;
				if(m_levelPositions[depth] == undefined || m_levelPositions[depth] == null) {
					m_levelPositions[depth] = m_edgeSpacing;
					posLeft = m_edgeSpacing;
				}
				else
					posLeft = m_levelPositions[depth];

				elem.css('float','');
				elem.css('position', 'absolute');
				elem.css('top', posTop);
				elem.css('left', posLeft);

				m_levelPositions[depth] = posLeft + width + 2*m_edgeSpacing;
				/*
				for(var i = depth + 1; i <= m_maxTreeDepth; i++) {
					if(m_levelPositions[i] == undefined || m_levelPositions[i] == null || m_levelPositions[i] < m_levelPositions[depth])
						m_levelPositions[i] = m_levelPositions[depth];
				}
				*/
			}/* else { 
				// Node and siblings are childless and will be drawn vertically.
				var parent = node.parent;
				for(var i in parent.children) {
					var child = parent.children[i];

					child.vertical = true;
					var node_classes = (child.cssClass == '' ? m_nodeClass : (m_nodeClass+' '+child.cssClass));
					var node_style = (child.cssStyle == '' ? '' : (' style="'+child.cssStyle+'" '));
					var str = '<div id="mmloc_'+m_elem.attr('id')+'_'+child.id+'" class="' + node_classes + '"' + node_style + '>' +
							'<p style="' + m_titleStyle + '">' + child.title.replace(/ /g, '&nbsp;') + '</p>' +
							child.name.replace(/ /g, '&nbsp;') + '</div>';
					m_elem.append(str);
					m_drawnNodes.push(child.id);
				}

				// Get max width among children.
				var width = 0;
				for(var i in parent.children) {
					var child = parent.children[i];
					var elem = $('#mmloc_'+m_elem.attr('id')+'_'+child.id);

					elem.css('float','left');
					var tempWidth = elem.width();
					if(tempWidth > width)
						width = tempWidth;
				}

				var posLeft = 0;
				for(var k = depth; k < depth+parent.children.length; k++) {
					if(m_levelPositions[k] == undefined || m_levelPositions[k] == null) {
						m_levelPositions[k] = m_edgeSpacing + m_verticalSpacing;
						tempPosLeft = m_edgeSpacing + m_verticalSpacing;
					}
					else
						tempPosLeft = m_levelPositions[k] + m_verticalSpacing;
					if(tempPosLeft > posLeft)
						posLeft = tempPosLeft;
				}
				
				var curDepth = depth;
				for(var i in parent.children) {
					var child = parent.children[i];
					var elem = $('#mmloc_'+m_elem.attr('id')+'_'+child.id);

					elem.css('float','left');
					elem.width(width);
					var posTop = curDepth * m_levelHeight + m_edgeSpacing;
					elem.css('float', '');
					elem.css('position','absolute');
					elem.css('top', posTop);
					elem.css('left', posLeft);
					m_levelPositions[curDepth] = posLeft + width + 2*m_edgeSpacing;

					if(m_levelNodes[curDepth] == undefined || m_levelNodes[curDepth] == null)
						m_levelNodes[curDepth] = new Array();

					m_levelNodes[curDepth].push(child);
					curDepth += 1;
				}
			}*/
		};

		var drawConnection = function(node) {
			if((node.children != undefined || node.children != null) && node.children.length > 0) {
				for(var i in node.children) {
					drawConnection(node.children[i]);
				}
			}

			if(node.super != undefined && node.super != null) {
				if(node.vertical == false) {
					jsPlumb.connect({
						source:'mmloc_'+m_elem.attr('id')+'_'+node.super,
						target:'mmloc_'+m_elem.attr('id')+'_'+node.id,
						paintStyle:{ lineWidth:1, strokeStyle:'#000' }, 
						anchors:["BottomCenter", "TopCenter"],
						endpoint: ["Rectangle", {width:1,height:1}],
						connector: ["Flowchart", {stub:1}]
					});
				} else if(node.vertical == true && node.childless_siblings == false) {
					jsPlumb.connect({
						source:'mmloc_'+m_elem.attr('id')+'_'+node.super,
						target:'mmloc_'+m_elem.attr('id')+'_'+node.id,
						paintStyle:{ lineWidth:1, strokeStyle:'#000' },
						anchors:["LeftMiddle", "LeftMiddle"],
						endpoint: ["Rectangle", {width:1,height:1}],
						connector: ["Flowchart", {stub:9}]
					});
				} else if(node.vertical == true && node.childless_siblings == true) {
					jsPlumb.connect({
						source:'mmloc_'+m_elem.attr('id')+'_'+node.super,
						target:'mmloc_'+m_elem.attr('id')+'_'+node.id,
						paintStyle:{ lineWidth:1, strokeStyle:'#000' }, 
						anchors:[[0.1, 1, 0, 1], "LeftMiddle"],
						endpoint: ["Rectangle", {width:1,height:1}],
						connector: ["Flowchart", {stub:1}]
					});
				}
			}
		};

		var callRepositionNodes = function() {
			do {
				m_nodesMoved = false;
				repositionNodes(m_root);
			} while(m_nodesMoved);
		}

		var getCenterOfChildren = function(node) {
			var right = 0;
			var left = $('#mmloc_'+m_elem.attr('id')+'_'+node.children[0].id).position().left;
			for(var i in node.children) {
				var child = node.children[i];
				var elem = $('#mmloc_'+m_elem.attr('id')+'_' + child.id);
				var pos = elem.position();
				if(pos.left < left)
					left = pos.left;
				if((pos.left + elem.width()) > right)
					right = pos.left + elem.width();
			}
			return Math.floor((left + right) / 2);
		};

		var repositionNodes = function(root) {
			var node = $('#mmloc_'+m_elem.attr('id')+'_'+root.id);
			var centerOfNode = Math.floor(((2*node.position().left) + node.width()) / 2);
			var level = (parseInt(node.css('top').replace('px', '')) - m_edgeSpacing) / m_levelHeight;

			if(root.children != undefined && root.children != null && root.children[0].vertical == false) {
				var centerOfChildren = getCenterOfChildren(root);
				if(centerOfNode < centerOfChildren) {
					var moveBy = (centerOfChildren - centerOfNode);

					boundary = parseInt(node.css('left').replace('px', ''));
					for(var i in m_levelNodes[level]) {
						moveNode = $('#mmloc_'+m_elem.attr('id')+'_'+m_levelNodes[level][i].id);
						if(parseInt(moveNode.css('left').replace('px','')) >= boundary) {
							m_nodesMoved = true;
							var left = parseInt(moveNode.css('left').replace('px', ''));
							moveNode.css('left', left + moveBy);
						}

					}
				}
				else if(centerOfNode > centerOfChildren) {
					var moveBy = (centerOfNode - centerOfChildren);

					var boundary = centerOfChildren;
					for(var i in root.children) {
						var child = $('#mmloc_'+m_elem.attr('id')+'_'+root.children[i].id);
						if(parseInt(child.css('left').replace('px','')) < boundary) {
							boundary = parseInt(child.css('left').replace('px',''));
						}
					}
					level = level+1;
					for(var i in m_levelNodes[level]) {
						moveNode = $('#mmloc_'+m_elem.attr('id')+'_'+m_levelNodes[level][i].id);
						if(parseInt(moveNode.css('left').replace('px','')) >= boundary) {
							m_nodesMoved = true;
							var left = parseInt(moveNode.css('left').replace('px', ''));
							moveNode.css('left', left + moveBy);
						}

					}
				}

				for(var i in root.children) {
					repositionNodes(root.children[i]);
				}
			}
			else if(root.children != undefined && root.children != null && root.children[0].vertical == true) {
				var childrenLeft = $('#mmloc_'+m_elem.attr('id')+'_'+root.children[0].id).position().left;
				var rootLeft = $('#mmloc_'+m_elem.attr('id')+'_'+root.id).position().left;
				if(rootLeft > (childrenLeft - 50)) {
					var moveBy = (rootLeft + 50) - childrenLeft;
					for(var i in root.children) {
						var child = root.children[i];
						var childNode = $('#mmloc_'+m_elem.attr('id')+'_'+child.id);
						var childLevel = (parseInt(childNode.css('top').replace('px', '')) - m_edgeSpacing) / m_levelHeight;
						for(var k in m_levelNodes[childLevel]) {
							var moveNode = $('#mmloc_'+m_elem.attr('id')+'_'+m_levelNodes[childLevel][k].id);
							if(parseInt(moveNode.css('left').replace('px','')) >= childrenLeft) {
								m_nodesMoved = true;
								var left = parseInt(moveNode.css('left').replace('px', ''));
								moveNode.css('left', left + moveBy);
							}

						}
					}
				}
				else if(rootLeft < (childrenLeft - 50)) {
					var moveBy = childrenLeft - 50 - rootLeft;
					var rootNode = $('#mmloc_'+m_elem.attr('id')+'_'+root.id);
					var rootLevel = (parseInt(rootNode.css('top').replace('px', '')) - m_edgeSpacing) / m_levelHeight;
					for(var i in m_levelNodes[rootLevel]) {
						var moveNode = $('#mmloc_'+m_elem.attr('id')+'_'+m_levelNodes[rootLevel][i].id);
						if(parseInt(moveNode.css('left').replace('px','')) >= rootLeft) {
							m_nodesMoved = true;
							var left = parseInt(moveNode.css('left').replace('px', ''));
							moveNode.css('left', left + moveBy);
						}

					}
				}
			}
		};

		// Return false if siblings have children.
		var checkSiblingsForChildren = function(node) {
			var parent = node.parent;

			if(parent == undefined || parent == null) {
				return false;
			}

			if(parent.children.length == 1) {
				return true;
			}

			for(var child in parent.children) {
				if(parent.children[child].children == undefined || parent.children[child].children == null) {

				}
				else if(parent.children[child].children.length > 0) {
					return false;
				}
			}

			return true;
		};

		if(debug) {
			this.getLevelNodes = function() {
				return m_levelNodes;
			}
			this.getMaxTreeDepth = function() {
				return m_maxTreeDepth;
			}
			this.getElement = function() {
				return m_elem;
			};
			this.getTrees = function() {
				return m_root;
			};

			this.getData = function() {
				return m_data;
			};
		}
	};

	$.fn.MMLOrgChart = function(options) {
		if(this.length > 1) {
			throw new Error('Call plugin on only one object.');
			return;
		}

		return new MMLOrgChart(this, options);
	};
})(jQuery);