/* FunctionManager.js
 * class for managing function creation, storage and lookup
 */

define([
	'underscore',
	'backbone',
	'models/data/functions/FunctionNode',
	'utils/Utils',

], function(_, Backbone, FunctionNode, Utils) {
	//datastructure to store path functions

	var functioncount = 0;

	var ParameterNode = {

		setName: function(name) {
			this.set('param_name', name);
		},

		renderStyle: function(geom) {
			console.log('rendering style of param');
			geom.fillColor = 'black';
			geom.fillColor.alpha = 0.25;
			geom.dashArray = [6, 8];
			geom.strokeColor = '#989898';
			geom.strokeWidth = 2.5;
			geom.visible = this.get('visible');
		}
	};


	var FunctionManager = Backbone.Model.extend({
		defaults: {},


		initialize: function() {
			this.rootFunctions = [];
			this.functions = this.rootFunctions;
			
		},

		createFunction: function(name, childList) {
			var f = new FunctionNode();
			f.set('f_name', 'function:' + functioncount);
			functioncount++;
			var centers = {
				x: 0,
				y: 0
			};
			for (var i = 0; i < childList.length; i++) {
				//this.convert(paramList[i]);
				//f.addParameter(paramList[i]);
				switch (childList[i].get('type')) {
					case 'list':
					case 'sampler':
						f.lists.push(childList[i]);
						var members = childList[i].getInstanceMembers();
						members.forEach(function(item) {
							f.addChildNode(item);
						});
						break;
					case 'function':
						f.functions.push(childList[i]);
						break;
					default:
						f.addChildNode(childList[i]);
						childList[i].hide();
						var center = childList[i].accessProperty('center');
						centers.x += center.x;
						centers.y += center.y;
						break;
				}
			}
			centers.x /= childList.length;
			centers.y /= childList.length;
			var data = {
				translation_delta: centers
			};
			f.modifyProperty(data);
			this.functions.push(f);
		},

		callFunction: function(func) {
			console.log('checking function called', func.get('called'));
			if (!func.get('called')) {
				func.call();
			
			} else {
				func.uncall();
				
			}
		},

		toggleOpenFunctions: function(currentNode, func) {
			currentNode.close();
			var children = func.open();
			this.functions = func.functions;
			return {
				toSelect: children,
				currentNode: func,
				lists: func.lists
			};
		},

		toggleClosedFunctions: function(currentNode, rootNode) {
			var nCurrent;
			var parent = currentNode.close();
			var toSelect = currentNode;
			if (parent) {
				console.log('setting current to parent');
				nCurrent = parent;
				this.functions = parent.functions;
			} else {
				nCurrent = rootNode;
				this.functions = this.rootFunctions;
			}
			nCurrent.open();
			return {
				currentNode: nCurrent,
				toSelect: toSelect
			};

		},

		closeAllFunctions: function() {
			for (var i = 0; i < this.functions.length; i++) {
				this.functions[i].close();
			}
		},

		convert: function(instance) {
			console.log('converting instance');

			console.log('parameterNode', ParameterNode);
			for (var k in ParameterNode) {
				if (ParameterNode.hasOwnProperty(k)) {
					console.log('converting property', k);
					instance[k] = ParameterNode[k];
				}
			}
		},

		addParamToFunction: function(func, instance) {
			this.convert(instance);
			func.addParameter(instance);
		},

	});
	return FunctionManager;
});