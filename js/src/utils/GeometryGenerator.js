define([

	'models/data/geometry/PathNode',
	'models/data/geometry/RectNode',
	'models/data/geometry/EllipseNode',
	'models/data/geometry/PolygonNode',
	'models/data/geometry/Group',
	'models/data/collections/Duplicator',
	'models/data/collections/ConstrainableList',
	'models/data/geometry/SVGNode',
], function(PathNode, RectNode, EllipseNode, PolygonNode, Group, Duplicator,ConstrainableList, SVGNode) {

	var init_lookup = {
			'path': PathNode,
			'ellipse': EllipseNode,
			'polygon': PolygonNode,
			'rectangle': RectNode,
			'group': Group,
			'duplicator': Duplicator,
			'list': ConstrainableList,
			'svg': SVGNode
		};

	var GeometryGenerator = {
 /*returns new child instance based on string name
     */
    getTargetClass: function(name) {
      var target_class = init_lookup[name];
      var child = new target_class({},{geometryGenerator:GeometryGenerator});
      return child;
    },

		


	};
	return GeometryGenerator;
});