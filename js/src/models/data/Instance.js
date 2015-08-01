/*Instance.js
 * used to store references of a shape object
 *
 */

define([
	'underscore',
	'jquery',
	'paper',
	'models/data/SceneNode',
	'models/data/InheritorCollection',

	'utils/PPoint',
	'utils/PFloat',
	'utils/PColor',
	'utils/PBool',
	'utils/PProperty',
	'utils/PConstraint',
	'utils/TrigFunc',
	'utils/ColorUtils'
], function(_, $, paper, SceneNode, InheritorCollection, PPoint, PFloat, PColor, PBool, PProperty, PConstraint, TrigFunc, ColorUtils) {


	var exporting_properties = ['position', 'translationDelta', 'scaling_origin', 'scalingDelta', 'rotation_origin',
		'rotationDelta', 'strokeColor', 'fillColor', 'stroke_width', 'val', 'name', 'type', 'visible', 'closed', 'order', 'id'
	];

	var constraints = ['position', 'translationDelta', 'scaling_origin', 'scalingDelta', 'rotation_origin',
		'rotationDelta', 'strokeColor', 'fillColor', 'stroke_width', 'val'
	];

	var Instance = SceneNode.extend({


		defaults: _.extend({}, SceneNode.prototype.defaults, {

			//selection defaults
			selected: false,
			proto_selected: false,
			inheritor_selected: false,
			ancestor_selected: false,
			selected_indexes: null,
			constraint_selected: null,

			//bounding box defaults
			bbox: null,
			i_bbox: null,
			inheritorbbox: null,
			width: 0,
			height: 0,
			//screen properies
			screen_position: null,
			screen_width: 0,
			screen_height: 0,

			/*==begin JSON export===*/
			/*constrainable properties to export to JSON*/
			position: null,
			translationDelta: null,
			scaling_origin: null,
			scalingDelta: null,
			rotation_origin: null,
			rotationDelta: null,
			strokeColor: null,
			fillColor: null,
			stroke_width: null,
			path_altered: null,
			val: null,
			index: null,
			member_count: null,


			/*basic datatypes to export to JSON*/
			name: 'instance',
			type: 'instance',
			visible: true,
			closed: false,
			order: 0,
			/*==end JSON export===*/

			//map of constrainable properties
			constrain_map: {
				position: ['x', 'y'],
				translationDelta: ['x', 'y'],
				scaling_origin: ['x', 'y'],
				scalingDelta: ['x', 'y'],
				rotation_origin: ['val'],
				rotationDelta: ['val'],
				strokeColor: ['r', 'g', 'b', 'a'],
				fillColor: ['r', 'g', 'b', 'a'],
				stroke_width: ['val'],
				//inheritors: []
			},

			reset: false,
			geom: null,
			selection_clone: null,
			inheritors: null,
			sibling_instances: null,
			is_proto: false,
			id: null,
			show: false,

			//path properties
			mod: -0.01,
			inheritance_selection_color: '#0D7C1F',
			proxy_selection_color: '#10B0FF',
			primary_selection_color: '#A5FF00',
			reference_selected_color: '#fc9917',
			relative_selected_color: '#9717fc',

			// EXPERIMENTAL
			selection_palette: ['#A5FF00', '#0D7C1F', '#FF4D4D', '#33D6FF', '#E698D2'],
			sel_palette_index: 0,

		}),

		initialize: function() {

			this.set('position', new PPoint(0, 0));
			this.set('center', new PPoint(0, 0));
			this.set('screen_top_left', new PPoint(0, 0));
			this.set('screen_top_right', new PPoint(0, 0));
			this.set('screen_height', new PFloat(0));
			this.set('screen_width', new PFloat(0));
			this.set('screen_bottom_right', new PPoint(0, 0));
			this.set('screen_bottom_left', new PPoint(0, 0));
			this.set('screen_bottom_left', new PPoint(0, 0));
			this.set('screen_left_center', new PPoint(0, 0));
			this.set('screen_right_center', new PPoint(0, 0));
			this.set('screen_top_center', new PPoint(0, 0));
			this.set('screen_bottom_center', new PPoint(0, 0));
			this.set('area', new PFloat(0));
			this.set('scaling_origin', new PPoint(0, 0));
			this.set('rotation_origin', new PPoint(0, 0));
			this.set('alpha', new PFloat(1));
			var translationDelta = new PPoint(0, 0);
			translationDelta.setNull(true);
			this.set('translationDelta', translationDelta);

			var scalingDelta = new PPoint(0, 0);
			scalingDelta.setNull(true);
			this.set('scalingDelta', scalingDelta);

			var rotationDelta = new PFloat(0);
			rotationDelta.setNull(true);
			this.set('rotationDelta', rotationDelta);

			var strokeColor = new PColor(0, 0, 0,1);
			strokeColor.setNull(true);
			this.set('strokeColor', strokeColor);

			var fillColor = new PColor(0, 0, 0,1);
			fillColor.setNull(true);
			this.set('fillColor', fillColor);

			var stroke_width = new PFloat(0);
			stroke_width.setNull(true);
			this.set('stroke_width', stroke_width);
			this.set('sibling_instances', []);
			this.set('inheritors', new InheritorCollection(this));
			this.get('inheritors').setNull(false);
			this.set('val', new PProperty(0));


			//============private properties==============//

			//inverse transformation matricies
			this._ti_matrix = undefined;
			this._si_matrix = undefined;
			this._ri_matrix = undefined;

			this._itemp_matrix = undefined;
			this._temp_matrix = new paper.Matrix();

			//temporary attributes
			this._translationDelta = new paper.Matrix();
			this._rotationDelta = new paper.Matrix();
			this._scalingDelta = new paper.Matrix();
			this._fillColor = {
				r: undefined,
				g: undefined,
				b: undefined,
				a: undefined
			};
			this._strokeColor = {
				r: undefined,
				g: undefined,
				b: undefined,
				a: undefined
			};

			this._stroke_width = undefined;
			this._rotation_origin = undefined;
			this._scaling_origin = undefined;
			this._position = undefined;
			this._visible = undefined;

			//============ end private properties==============//


			var bounds = new paper.Rectangle(0, 0, 1, 1);
			this.set('i_bbox', {
				topLeft: null,
				bottomRight: null,
			});

			var path_altered = new PBool(false);
			path_altered.setNull(true);
			this.set('path_altered', path_altered);

			var index = new PFloat(0);
			index.setNull(false);
			this.set('index', index);

			var member_count = new PFloat(1);
			member_count.setNull(false);
			this.set('member_count', member_count);

			this.set('id', this.get('type') + '_' + new Date().getTime().toString());

			this.extend(PConstraint);
			SceneNode.prototype.initialize.apply(this, arguments);
			this.on('change:selected', this.selectionChange);
			this.isReturned = false;

			var parent = this;

		},

		/* deleteSelf
		 * function called before instance is removed from
		 * scene graph
		 */
		deleteSelf: function() {
			this.reset();
			var geom = this.get('geom');
			if (geom) {
				geom.remove();
				this.get('selection_clone').remove();

			}
			this.clearBoundingBoxes();

			for (var i = 0; i < this.children.length; i++) {
				this.children[i].deleteSelf();
				//this.children[i].destroy();
			}
			var inheritorCollection = this.get('inheritors');
			inheritorCollection.deleteSelf();

			var parent = this.getParentNode();
			if (parent) {
				parent.removeChildNode(this);
			}
			//this.trigger('delete', this);
		},


		/*hasMember, getMember, toggleOpen, toggleClosed, addMemberToOpen
		 * evaluation and access functions to assist in managing lists
		 */

		hasMember: function(member, top, last) {
			if (member === this) {
				return last;
			}
		},

		getMember: function(member) {
			if (member === this) {
				return this;
			}
			return null;
		},

		/* getRange: function used to modify constraints mappings for lists*/
		getRange: function() {
			return 1; //this.get('member_count').getValue();
		},

		toggleOpen: function(item) {
			return null;
		},

		toggleClosed: function(item) {
			return null;
		},

		addMemberToOpen: function(data, added_bool) {
			return false;
		},
		recRemoveMember: function(data) {
			return false;
		},
		removeAllMembers: function() {
			return [];
		},



		close: function() {
			return this.getParentNode();
		},

		/* create
		 * Prototypal inheritance action:
		 * creates a new instance which inherits from
		 * the parent instance.
		 * TODO: add in checks to prevent diamond inheritance
		 */
		create: function() {
			var instance = new this.constructor();
			var value = this.getValue();
			console.log('create value',value);
			instance.setValue(value);
			this.addInheritor(instance);
			return instance;
		},

		addInheritor: function(instance) {
			this.set('is_proto', true);
			var inheritorCollection = this.get('inheritors');
			instance.set('proto_node', this);
			inheritorCollection.addInheritor(instance);
			instance.reset();
			var g_clone = this.getShapeClone(true);
			instance.changeGeomInheritance(g_clone);
			instance.createSelectionClone();
			this.addChildNode(instance);
		},

		removeInheritor: function(instance) {
			var inheritorCollection = this.get('inheritors');
			return inheritorCollection.removeInheritor(instance);
		},


		setPrototype: function(prototype) {
			prototype.addInheritor(this);
			this.set('proto_node', prototype);
			var clone = prototype.getShapeClone(true);
			this.changeGeomInheritance(clone);

		},

		removePrototype: function() {
			var proto_node = this.get('proto_node');
			if (proto_node) {
				proto_node.removeInheritor(this);
				var proto_vals = proto_node.getValue();
				var constrainMap = this.get('constrain_map');
				for (var property_name in constrainMap) {
					if (constrainMap.hasOwnProperty(property_name)) {
						if (this.get(property_name).isNull()) {
							this.get(property_name).setNull(false);
							this.get(property_name).setValue(proto_vals[property_name]);
						}
					}
				}
				this.set('proto_node', null);
			}
		},

		createSelectionClone: function() {
			if (this.get('selection_clone')) {
				this.get('selection_clone').remove();
				this.set('selection_clone', null);
			}
			var selection_clone = this.getShapeClone();
			var targetLayer = paper.project.layers.filter(function(layer) {
				return layer.name === 'ui_layer';
			})[0];
			targetLayer.addChild(selection_clone);
			selection_clone.data.instance = this;
			selection_clone.fillColor = null;
			selection_clone.strokeWidth = 3;
			selection_clone.selected = false;
			this.set('selection_clone', selection_clone);
		},

		changeGeomInheritance: function(geom) {
			if (this.get('geom')) {
				this.get('geom').remove();
			}
			if (this.get('selection_clone')) {
				this.get('selection_clone').remove();
				this.set('selection_clone', null);
			}
			if (this.get('bbox')) {
				this.get('bbox').remove();
				this.set('bbox', null);
			}

			geom.data.instance = this;
			geom.data.geom = true;
			geom.data.nodetype = this.get('name');
			this.set('geom', geom);
			for (var i = 0; i < this.children.length; i++) {
				if (this.children[i].get('name') === 'point') {
					this.children[i].deleteSelf();
				} else {
					this.children[i].changeGeomInheritance(geom.clone());
				}

			}
			this.setPathAltered();
		},

		setPathAltered: function() {
			var path_altered = this.get('path_altered');
			path_altered.setValue(true);
		},

		reset: function() {
			this.set('rendered', false);
			this.set('visited', false);

			this.set('i_bbox', {
				topLeft: null,
				bottomRight: null,
			});
			if (this.get('inheritor_bbox')) {
				this.get('inheritor_bbox').remove();
			}



			this._ti_matrix = this._translationDelta.inverted();
			this._ri_matrix = this._rotationDelta.inverted();
			this._si_matrix = this._scalingDelta.inverted();
			this._itemp_matrix = this._temp_matrix.inverted();
			this._temp_matrix.reset();
			this._translationDelta.reset();
			this._scalingDelta.reset();
			this._rotationDelta.reset();
		},


		//triggered on change of select property, removes bbox
		selectionChange: function() {
			if (!this.get('selected')) {
				if (this.get('bbox')) {
					//			this.get('bbox').visible = false;
				}
			}
		},

		// sets the geom visibility to false
		hide: function() {
			this.set('visible', false);
			this.set('selected', false);
			this.get('geom').visible = false; // hacky
			this.get('selection_clone').visible = false;
		},

		show: function() {
			this.set('visible', true);
			this.get('geom').visible = true;
			if (this.get('constraint_selected')) {
				this.get('selection_clone').visible = true;
			}

		},

		hideChildren: function() {
			this.hide();

			for (var i = 0; i < this.children.length; i++) {
				this.children[i].hideChildren();
			}
		},

		showChildren: function() {
			this.set('visible', true);
			for (var i = 0; i < this.children.length; i++) {
				this.children[i].showChildren();
			}
		},

		bringToFront: function() {
			var geom = this.get('geom');
			if (geom) {
				geom.bringToFront();
				this.get('selection_clone').bringToFront();
			}
		},

		resetProperties: function() {
			this.clear().set(this.defaults);
			this.get('position').setValue({
				x: 0,
				y: 0
			});
			this.get('translationDelta').setValue({
				x: 0,
				y: 0
			});
			this.get('center').setValue({
				x: 0,
				y: 0
			});
			this.get('scaling_origin').setValue({
				x: 0,
				y: 0
			});
			this.get('rotation_origin').setValue({
				x: 0,
				y: 0
			});
			this.get('matrix').reset();
		},


		resetStylesToPrototype: function(data, recurse) {

			if (data.fillColor) {
				this.get('fillColor').setNull(true);
			}

			if (data.strokeColor) {
				this.get('strokeColor').setNull(true);
			}

			if (data.stroke_width) {
				this.get('stroke_width').setNull(true);
			}
			if (recurse) {
				var inheritors = this.get('inheritors');
				for (var i = 0; i < inheritors.length; i++) {
					inheritors[i].resetStylesToPrototype(data, recurse);
				}
			}
		},


		/*_setPropertiesToInstance
		 * sets delta to match properties of a given instance, depending on the properties of the
		 * data that is passed in
		 */
		_setPropertiesToInstance: function(data, instance) {

			if (data.translationDelta) {
				this.get('translationDelta').setValue(instance.get('translationDelta').getValue());
			}

			if (data.rotationDelta) {
				this.get('rotationDelta').setValue(instance.get('rotationDelta').getValue());

			}
			if (data.scalingDelta) {
				this.get('scalingDelta').setValue(instance.get('scalingDelta').getValue());

			}
		},

		//placeholder function
		deselectSegments: function() {

		},


		/*_setPropertiesToPrototype
		 * removes property of instance so that it is overriden by prototype,
		 * if property exists in the data
		 */
		_setPropertiesToPrototype: function(data) {
			if (data.translationDelta) {

				var protoNode = this.get('proto_node');

				if (protoNode) {
					//this.set('position', protoNode.get('position').clone());
					//this.set('rotation_origin', protoNode.get('rotation_origin').clone());
					//this.set('scaling_origin', protoNode.get('scaling_origin').clone());
					this.get('translationDelta').setNull(true);
				}
			}

			if (data.rotationDelta) {
				this.get('rotationDelta').setNull(true);
			}
			if (data.scalingDelta) {
				this.get('scalingDelta').setNull(true);
			}
		},


		toJSON: function() {
			var data = {};
			var target = this;
			_.each(exporting_properties, function(property) {
				if (_.contains(constraints, property)) {
					data[property] = target.get(property).toJSON();

				} else {

					data[property] = target.get(property);
				}
			});
			return data;

		},

		parseJSON: function(data) {
			this.set(data.toJSON);
		},


		isValid: function() {
			var constrainMap = this.get('constrain_map');
			var valid = true;
			for (var property in constrainMap) {
				if (constrainMap.hasOwnProperty(property)) {
					//console.log('property is valid', property, this.isValidFor(property));
					valid = valid ? this.isValidFor(property) : false;
				}
			}
			return valid;
		},

		invalidate: function() {
			var constrainMap = this.get('constrain_map');
			for (var property_name in constrainMap) {
				if (constrainMap.hasOwnProperty(property_name)) {
					var property = this.get(property_name);
					if (property) {
						property.invalidate();
					}
				}
			}
		},

		isValidFor: function(property_name) {
			var property = this.get(property_name);
			if (property) {
				return property.isValid();
			}
			return true;
		},


		activateProperty: function(property_name) {
			this.get(property_name).setNull(false);
			return this.get(property_name);
		},

		
		modifyPriorToCompile: function(data) {
			var value = this.getValue();
			var merged = TrigFunc.merge(value, data);
			this.set('merged', merged);
		},


		_modifyMatrixAfterCompile: function(property_name, internal_matrix, attribute_constraint, value, set) {
			//attribute is not constrained, modification allowed

			//attribute sub properties are constrained, selective modification allowed;

			switch (property_name) {
				case 'translationDelta':
					if (!attribute_constraint) {
						if (set) {
							internal_matrix.tx = (value.translation) ? 0 : internal_matrix.tx;
							internal_matrix.ty = (value.translation) ? 0 : internal_matrix.ty;
						}
						if (value.translation) {
							internal_matrix.translate(value.translation.x, value.translation.y);
							return true;
						}
						return false;

					} else if (attribute_constraint && attribute_constraint.x && attribute_constraint.y) {
						return false;
					} else if (attribute_constraint.x && !attribute_constraint.y) {

						if (set) {
							internal_matrix.ty = (value.translation) ? 0 : internal_matrix.ty;
						}
						internal_matrix.translate(0, value.translation.y);
						return true;
					} else if (!attribute_constraint.x && attribute_constraint.y) {
						if (set) {
							internal_matrix.tx = (value.translation) ? 0 : internal_matrix.tx;
						}
						if (value.translation) {
							internal_matrix.translate(value.translation.x, 0);
							return true;
						}
						return false;
					}
					break;
				case 'scalingDelta':
					var s_origin = this._scaling_origin;
					if (!attribute_constraint) {
						if (set) {
							internal_matrix.d = (value.scaling) ? 0 : internal_matrix.d;
							internal_matrix.a = (value.scaling) ? 0 : internal_matrix.a;
						}
						if (value.scaling) {
							internal_matrix.scale(value.scaling.x, value.scaling.y, s_origin);
							return true;
						}
						return false;

					} else if (attribute_constraint && attribute_constraint.x && attribute_constraint.y) {
						return false;
					} else if (attribute_constraint.x && !attribute_constraint.y) {
						if (set) {
							internal_matrix.d = (value.scaling) ? 0 : internal_matrix.d;
						}
						if (value.scaling) {
							internal_matrix.scale(1, value.scaling.y, s_origin);
							return true;
						}
						return false;
					} else if (!attribute_constraint.x && attribute_constraint.y) {
						if (set) {
							internal_matrix.a = (value.scaling) ? 0 : internal_matrix.a;
						}
						if (value.scaling) {
							internal_matrix.scale(value.scaling.x, 1, s_origin);
							return true;
						}
						return false;
					}
					break;
				case 'rotationDelta':
					var r_origin = this._rotation_origin;
					if (attribute_constraint) {
						return false;
					} else {
						if (set) {
							internal_matrix.a = (value.rotation) ? 0 : internal_matrix.a;
							internal_matrix.b = (value.rotation) ? 0 : internal_matrix.b;
							internal_matrix.c = (value.rotation) ? 0 : internal_matrix.c;
							internal_matrix.d = (value.rotation) ? 0 : internal_matrix.d;
						}
						internal_matrix.rotate(value.rotation, r_origin);
						return true;
					}
					break;


			}

			return false;

		},

		_modifyObjectAfterCompile: function(internal_attribute, attribute_constraint, value, set) {
			//attribute is not constrained, modification allowed
			if (!attribute_constraint) {
				for (var v in value) {
					if (value.hasOwnProperty(v)) {
						internal_attribute[v] = value[v];
					}
				}
				return true;
			}
			//attribute sub properties are constrained, selective modification allowed;
			else {
				var modified = false;
				for (var _v in value) {
					if (value.hasOwnProperty(_v)) {
						if (!attribute_constraint.hasOwnProperty(_v)) {
							internal_attribute[_v] = value[_v];
							modified = true;
						}
					}
				}
				return modified;
			}
			return false;

		},

		_modifyValueAfterCompile: function(internal_attribute, value, set) {

		},


		/* getConstraint
		 * returns an object comprised of all existing constraints in one of 3 states:
		 *
		 * 1) if entire instance is constrained by a function returns {self: constraint_obj}
		 *
		 * 2) if some of the attributes of the instance are constrainted, returns an object with a
		 * list of the currently constrained attributes of this instance, with references to these
		 * constraints eg {translationDelta:{x:constraint_obj},rotationDelta:{self:constraint_obj}}
		 * note: these objects will either contain 1 property "self", meaning that the entire attribute
		 * is constrained, or several properties reflecting the sub-attribuites of the instance attribute which are constrained
		 *
		 * 3) if there are no constraints on the instance, returns an empty object
		 *
		 */
		getConstraint: function() {
			var constrainMap = this.get('constrain_map');
			var data = {};
			var self = this.getSelfConstraint();
			if (self) {
				data.self = self;
				return data;
			} else {
				var constraintFound = false;
				for (var propertyName in constrainMap) {
					if (constrainMap.hasOwnProperty(propertyName)) {
						var constraint = this.get(propertyName).getConstraint();
						if (constraint) {
							data[propertyName] = constraint;
						}
						constraintFound = true;
					}
				}
				if (constraintFound) {
					return data;
				}
			}


		},

		removeConstraint: function(prop, dimensions) {
			this.get(prop).removeConstraint(dimensions);
		},

		/*setValue
		 * modifies the properties of this instance in accordance with the
		 * data passed in
		 * note- in future should unifiy this with the modify property function?
		 */
		setValue: function(data) {
			for (var prop in data) {
				if (data.hasOwnProperty(prop)) {

					var p = data[prop];
					if (typeof data[prop] !== 'object') {
						p = {
							val: data[prop]
						};
					}
					if(!p.operator){
						p.operator = 'set';
					}
					console.log('set_value',prop,p);
					if(p.operator ==='set'){
						this.get(prop).setValue(p);
					}
					else if(p.operator==='add'){
						this.get(prop).add(p);
					}
				}
			}
			this.setNull(false);
		},



		/* getValue
		 * returns an object containing all of the values of constrainable properties
		 * TODO: Make recursive (will not work for objects with 3+ leves of heirarchy)
		 */

		getValue: function() {
			var constrainMap = this.get('constrain_map');
			var value = {};
			for (var propertyName in constrainMap) {
				if (constrainMap.hasOwnProperty(propertyName)) {
					value[propertyName] = this.getValueFor(propertyName);
				}
			}
			return value;
		},


		/* getValueFor
		 * returns the actual value for a given property
		 */
		getValueFor: function(property_name) {
			var property = this.get(property_name);
			if (property) {
				return property.getValue();
			} else {
				return null;
			}
		},


		/* getConstraintValues
		 * returns an object containing all constrained properties of
		 * this instance with their values;
		 * TODO: Make recursive (will not work for objects with 3+ leves of heirarchy)
		 */

		getConstraintValues: function() {
			var constraints = this.getConstraint();
			var value = {};
			for (var c in constraints) {
				if (constraints.hasOwnProperty(c)) {
					if (constraints[c].getValue) {
						value[c] = constraints[c].getValue();
					} else {
						value[c] = {};
						for (var v in constraints[c]) {
							if (constraints[c].hasOwnProperty(v)) {
								value[c][v] = constraints[c][v].getValue();
							}
						}
					}
				}
			}
			return value;
		},



		getCenter: function() {
			return {
				x: this.get('position').x + this.get('delta').x,
				y: this.get('position').y + this.get('delta').y
			};
		},

		getUpperLeft: function() {
			return {
				x: this.get('position').x + this.get('delta').x - this.get('width') / 2,
				y: this.get('position').y + this.get('delta').y - this.get('height') / 2,
			};
		},

		getLowerRight: function() {
			return {
				x: this.get('position').x + this.get('delta').x + this.get('width') / 2,
				y: this.get('position').y + this.get('delta').y + this.get('height') / 2,
			};
		},



		deselect: function() {
			this.set('selected', false);
			this.setSelectionForInheritors(false);
		},

		select: function(segments) {
			this.set('selected', true);
			this.setSelectionForInheritors(true, null, null, 1);
		},

		/* setSelectionForInheritors
		 * toggles selection mode for objects which inherit
		 * from this. Optionally also toggles selection for all
		 * ancestors.
		 */
		setSelectionForInheritors: function(select, mode, modifer, recurse) {
			var inheritors = this.get('inheritors').inheritors;
			var alpha;
			var proto = this.get('proto_node');
			if (proto) {
				if (!select) {
					proto.set('inheritor_selected', false);
					proto.setSelectionForInheritors(false);
				} else {
					if (recurse > 0) {
						if (mode === 'proxy') {
							proto.set('inheritor_selected', 'proxy');

						} else {
							proto.set('inheritor_selected', 'standard');
							alpha = proto.get('alpha');
							alpha.setValue(1);
							proto.get('alpha').setValue(alpha.getValue());
						}
					} else {
						proto.set('inheritor_selected', false);
						alpha = proto.get('alpha');
						alpha.setValue(1);
						proto.get('alpha').setValue(alpha.getValue());
					}
					proto.setSelectionForInheritors(select, 'standard', 'none', 0);
				}

			}

			for (var i = 0; i < inheritors.length; i++) {
				inheritors[i].set('proto_selected', select);
				alpha = inheritors[i].get('alpha');
				alpha.setValue(1);
				inheritors[i].get('alpha').setValue(alpha.getValue());
			}
		},

		updateBoundingBox: function(instance) {
			if (instance.get('screen_top_left') && instance.get('screen_bottom_right')) {
				var i_bbox = this.get('i_bbox');
				var i_topLeft = instance.get('screen_top_left').getValue();
				var i_bottomRight = instance.get('screen_bottom_right').getValue();

				if (!i_bbox.topLeft) {
					i_bbox.topLeft = i_topLeft;
				} else {
					if (i_topLeft.x < i_bbox.topLeft.x) {
						i_bbox.topLeft.x = i_topLeft.x;
					}
					if (i_topLeft.y < i_bbox.topLeft.y) {
						i_bbox.topLeft.y = i_topLeft.y;
					}
				}

				if (!i_bbox.bottomRight) {
					i_bbox.bottomRight = i_bottomRight;
				} else {
					if (i_bottomRight.x > i_bbox.bottomRight.x) {
						i_bbox.bottomRight.x = i_bottomRight.x;
					}
					if (i_bottomRight.y > i_bbox.bottomRight.y) {
						i_bbox.bottomRight.y = i_bottomRight.y;
					}
				}
			}

		},

		getSelectionColor: function() {
			var color_palette = this.get('selection_palette');
			var color_ind = this.get('sel_palette_index');
			return color_palette[color_ind];
		},


		/* compile
		computes the current properties of the instance given current 
		constraints and inheritance */
		compile: function() {
			//console.log('compiling', this.get('id'), 'isValid:', this.isValid());
			//if (this.isValid() || this.get('merged')) {
			//	return false;
			//} else {
				this.compileTransformation();
				this.compileStyle();
				return true;
			//}
			//this.set('merged', null);
		},

		compileTransformation: function() {

			var scalingDelta, rotationDelta, translationDelta;
			var merged = this.get('merged');
			if (!merged) {
				scalingDelta = this.getValueFor('scalingDelta');
				rotationDelta = this.getValueFor('rotationDelta');
				translationDelta = this.getValueFor('translationDelta');
			} else {

				scalingDelta = merged.scalingDelta;
				rotationDelta = merged.rotationDelta;
				translationDelta = merged.translationDelta;
			}

			this._rotation_origin = this.get('rotation_origin').toPaperPoint();
			this._scaling_origin = this.get('scaling_origin').toPaperPoint();
			this._position = this.get('position').toPaperPoint();


			this._scalingDelta.scale(scalingDelta.x, scalingDelta.y, this._scaling_origin);
			this._rotationDelta.rotate(rotationDelta, this._rotation_origin);
			this._translationDelta.translate(translationDelta.x, translationDelta.y);

			this._temp_matrix.preConcatenate(this._rotationDelta);
			this._temp_matrix.preConcatenate(this._scalingDelta);
			this._temp_matrix.preConcatenate(this._translationDelta);

		},

		compileStyle: function() {

			var merged = this.get('merged');
			if (merged) {
				this._fillColor = merged.fillColor;
				this._strokeColor = merged.strokeColor;
				this._stroke_width = merged.stroke_width;
			} else {
				this._fillColor = this.getValueFor('fillColor');
				this._strokeColor = this.getValueFor('strokeColor');
				this._stroke_width = this.getValueFor('stroke_width');
			}

			//TODO: consider changing visible to a constrainable property?
			this._visible = this.get('visible');
		},

		/*render
		 * draws instance on canvas
		 */
		render: function() {
			if (!this.get('rendered')) {
				if (this.get('name') != 'root') {

					var geom = this.renderGeom();
					if (geom) {
						this.renderStyle(geom);
						this.renderSelection(geom);
					}

					this.set('rendered', true);


				}
				return 'root';
			}
		},


		renderStyle: function(geom) {
			if (!this._fillColor.noColor) {
				if (!geom.fillColor) {
					geom.fillColor = new paper.Color(0, 0, 0);
				}
				geom.fillColor.hue = this._fillColor.h;
				geom.fillColor.saturation = this._fillColor.s;
				geom.fillColor.lightness = this._fillColor.l;
				geom.fillColor.alpha = this._fillColor.a;
			} else {
				geom.fillColor = undefined;
			}
			if (!this._strokeColor.noColor) {
				if (!geom.fillColor) {
					geom.strokeColor = new paper.Color(0, 0, 0);
				}
				geom.strokeColor.hue = this._strokeColor.h;
				geom.strokeColor.saturation = this._strokeColor.s;
				geom.strokeColor.lightness = this._strokeColor.l;
				geom.strokeColor.alpha = this._strokeColor.a;
				geom.strokeColor.alpha = this._strokeColor.a;
			} else {
				geom.strokeColor = undefined;
			}

			geom.strokeWidth = this._stroke_width;
			geom.visible = this._visible;

		},

		renderInheritorBoundingBox: function(geom) {
			if (this.get('inheritor_bbox')) {
				this.get('inheritor_bbox').remove();
			}
			var inheritors = this.get('inheritors').getValueFor();
			for (var k = 0; k < inheritors.length; k++) {
				this.updateBoundingBox(inheritors[k]);
			}
			var i_bbox = this.get('i_bbox');
			if (i_bbox.bottomRight) {
				var width = i_bbox.bottomRight.x - i_bbox.topLeft.x;
				var height = i_bbox.bottomRight.y - i_bbox.topLeft.y;
				var inheritor_bbox = new paper.Path.Rectangle(i_bbox.topLeft, new paper.Size(width, height));
				this.set('inheritor_bbox', inheritor_bbox);
				return inheritor_bbox;
			}
		},

		clearBoundingBoxes: function() {
			if (this.get('bbox')) {
				this.get('bbox').remove();
				this.set('bbox', null);
			}
			if (this.get('inheritor_bbox')) {
				this.get('inheritor_bbox').remove();
				this.set('inheritor_bbox', null);

			}
		},

		renderSelection: function(geom) {
			var selected = this.get('selected');
			var constraint_selected = this.get('constraint_selected');
			var bbox;
			var selection_clone = this.get('selection_clone');

			if (constraint_selected) {
				if (!selection_clone) {
					this.createSelectionClone();
					selection_clone = this.get('selection_clone');
				}
				selection_clone.visible = true;
				selection_clone.strokeColor = this.get(constraint_selected + '_color');

			} else {
				selection_clone.visible = false;

			}

			if (selected) {
				geom.selectedColor = this.getSelectionColor();
				bbox = this.get('bbox');
				bbox.selectedColor = this.getSelectionColor();
				bbox.selected = (constraint_selected) ? false : true;
				bbox.visible = (constraint_selected) ? false : true;
				geom.selected = (constraint_selected) ? false : true;
			}
		},


		renderGeom: function() {
			var visible = this.get('visible');
			var geom = this.get('geom');
			geom.bringToFront();
			var path_altered = this.get('path_altered').getValue();
			var selection_clone = this.get('selection_clone');
			var bbox = this.get('bbox');

			if (!bbox) {
				var size = new paper.Size(geom.bounds.width, geom.bounds.height);

				bbox = new paper.Path.Rectangle(geom.bounds.topLeft, size);
				bbox.data.instance = this;
				this.set('bbox', bbox);
				var targetLayer = paper.project.layers.filter(function(layer) {
					return layer.name === 'ui_layer';
				})[0];
				targetLayer.addChild(bbox);
			}
			if (!path_altered) {
				//geom.transform(this._itemp_matrix);
				geom.transform(this._ti_matrix);
				geom.transform(this._si_matrix);
				geom.transform(this._ri_matrix);
				selection_clone.transform(this._ti_matrix);
				selection_clone.transform(this._si_matrix);
				selection_clone.transform(this._ri_matrix);
				bbox.transform(this._ti_matrix);
				bbox.transform(this._si_matrix);
				bbox.transform(this._ri_matrix);
				var widthScale = geom.bounds.width / bbox.bounds.width;
				var heightScale = geom.bounds.height / bbox.bounds.height;
				bbox.scale(widthScale, heightScale);
				geom.selected = false;
				bbox.selected = false;

			} else {
				if (!selection_clone) {
					this.createSelectionClone();
					selection_clone = this.get('selection_clone');
				}


			}

			var position = this.get('position').toPaperPoint();
			geom.position = position;
			bbox.position = position;
			selection_clone.position = position;
			geom.transform(this._rotationDelta);
			geom.transform(this._scalingDelta);
			geom.transform(this._translationDelta);

			selection_clone.transform(this._rotationDelta);
			selection_clone.transform(this._scalingDelta);
			selection_clone.transform(this._translationDelta);

			bbox.transform(this._rotationDelta);
			bbox.transform(this._scalingDelta);
			bbox.transform(this._translationDelta);

			this.updateScreenBounds(geom);

			this.get('path_altered').setValue(false);
			geom.visible = visible;
			return geom;
		},


		copyAttributes: function(clone, deep) {
			clone.get('position').setValue(this.get('position').getValue());
			clone.get('translationDelta').setValue(this.get('translationDelta').clone());
			clone.get('rotationDelta').setValue(this.get('rotationDelta').getValue());
			clone.get('scalingDelta').setValue(this.get('scalingDelta').getValue());
			clone.get('center').setValue(this.get('center').getValue());
			clone.get('scaling_origin').setValue(this.get('scaling_origin').getValue());
			clone.get('rotation_origin').setValue(this.get('rotation_origin').getValue());
			clone.set('bbox', this.get('bbox').clone());
			return clone;
		},

		/*returns a clone of the paper js shape*/
		getShapeClone: function(relative) {
			var clone = this.get('geom').clone();
			if (relative) {
				clone.transform(this._ti_matrix);
				clone.transform(this._ri_matrix);
				clone.transform(this._si_matrix);
			}
			return clone;
		},

		animateAlpha: function(levels, property, mode, modifier, curlevel) {
			var inheritors = this.get('inheritors').getValueFor();
			var alpha = this.get('alpha');
			var mod = this.get('mod');
			if (alpha.getValue() < 0.65) {
				mod = 0.01;
			} else if (alpha.getValue() >= 1) {
				mod = -0.01;
			}

			alpha.add(mod);

			if (mode === 'proxy') {
				var proto = this.get('proto_node');
				if (proto) {
					proto.get('alpha').setValue(alpha.getValue());
					proto.get('geom   ').fillColor.alpha = alpha.getValue();
				}
			} else {
				for (var i = 0; i < inheritors.length; i++) {
					var inheritor = inheritors[i];
					if (inheritor.get(property).isNull() || modifier != 'none') {
						inheritor.get('alpha').setValue(alpha.getValue());
						inheritor.get('geom').fillColor.alpha = alpha.getValue();
						inheritor.animateAlpha(levels, property, mode, modifier, curlevel + 1);
					}
				}
			}
		},

		updateScreenBounds: function(targetGeom) {
			var screen_bounds = targetGeom.bounds;
			var center = this.get('center');
			center.setValue(screen_bounds.center);
			this.get('screen_top_left').setValue(screen_bounds.topLeft);
			this.get('screen_top_right').setValue(screen_bounds.topRight);
			this.get('screen_bottom_right').setValue(screen_bounds.bottomRight);
			this.get('screen_bottom_left').setValue(screen_bounds.bottomLeft);
			this.get('screen_left_center').setValue(screen_bounds.leftCenter);
			this.get('screen_right_center').setValue(screen_bounds.rightCenter);
			this.get('screen_bottom_center').setValue(screen_bounds.bottomCenter);
			this.get('screen_top_center').setValue(screen_bounds.topCenter);
			this.get('area').setValue(screen_bounds.area);
			this.get('screen_width').setValue(screen_bounds.width);
			this.get('screen_height').setValue(screen_bounds.height);
		}

	});

	return Instance;



});