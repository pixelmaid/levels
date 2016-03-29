/*SVGNode.js
 * imported svg object
 * extends PathNode
 */


define([
  'underscore',
  'models/data/geometry/Group',
  'models/data/geometry/PathNode',
  'models/data/geometry/GeometryNode',
  'utils/TrigFunc',
  'models/data/properties/PPoint',
  'paper',
  'models/data/properties/PFloat',
  'models/data/properties/PColor'


], function(_, Group, PathNode, GeometryNode, TrigFunc, PPoint, paper, PFloat, PColor) {
  //drawable paper.js path object that is stored in the pathnode
  var SVGNode = Group.extend({

    defaults: _.extend({}, Group.prototype.defaults, {

      name: 'svg',
      type: 'geometry',

    }),


    initialize: function(data) {
      Group.prototype.initialize.apply(this, arguments);
      this.get('strokeWidth').setValue(1);
      this.get('fillColor').setValue({h:1,s:0,b:0});
      this.get('strokeColor').setValue({h:1,s:0,b:0});
    },

    changeGeomInheritance: function(geom) {


      if (this.get('geom')) {
        var ok = (geom && geom.insertBelow(this.get('geom')));
        if (ok) {

          this.get('geom').remove();
        }
        this.get('geom').data = null;
        this.set('geom', null);

      }


      this.set('geom', geom);

      this.setData(geom);
      this.createBBox();

    },

    setData: function(geom){
       geom.data.instance = this;
      geom.data.geom = true;
      geom.data.nodetype = this.get('name');
      if(geom.children){
        for(var i=0;i<geom.children.length;i++){
          this.setData(geom.children[i]);
        }
      }
    },

    toggleOpen: function() {
      return;
    },

    toggleClosed: function() {
      return;
    },

    transformSelf: function(){
      GeometryNode.prototype.transformSelf.call(this);
    },
    render: function() {

      if (!this.get('rendered')) {
        var geom = this.get('geom');
        console.log('svg translation delta',this.get('translationDelta').getValue());
        this.transformSelf();
        geom.transform(this._matrix);
        this.renderStyle(geom);
        this.renderSelection(geom);

        this.set('rendered', true);
      }

      //GeometryNode.prototype.render.apply(this, arguments);

    },
    reset: function() {
      GeometryNode.prototype.reset.apply(this, arguments);

    },

     create: function(noInheritor) {
      var instance = this.geometryGenerator.getTargetClass(this.get('name'));
      var value = this.getValue();
      instance.setValue(value);
      var g_clone = this.getShapeClone(true);
      instance.changeGeomInheritance(g_clone);
      instance.set('rendered', true);
      instance._matrix = this._matrix.clone();
      instance.createBBox();
      return instance;
    },

    getShapeClone: function(){
      return PathNode.prototype.getShapeClone.call(this);
    },


    renderStyle: function(geom) {
      this._visible = this.get('visible');
      geom.visible = this._visible;
      if(!this.get('inFocus')){
        geom.opacity = 0.5;
      }
      else{
        geom.opacity = 1;
      }
    },

    getValueFor: function(property_name) {

      var property = this.get(property_name);
      return this.getValue()[property_name];

    },


    renderSelection: function(geom) {
      Group.prototype.renderSelection.call(this, geom);

    },


  });
  return SVGNode;
});