/*Duplicator.js
 * list which can enact iterative constraints on its members
 */

define([
        'underscore',
        'models/data/collections/ConstrainableList',
        'utils/PFloat',
        'utils/PBool',
        'paper',
        'utils/PConstraint',
        'models/data/Constraint',
        'utils/TrigFunc'

    ],

    function(_, ConstrainableList, PFloat, PBool, paper, PConstraint, Constraint, TrigFunc) {
        var Duplicator = ConstrainableList.extend({

            defaults: _.extend({}, ConstrainableList.prototype.defaults, {
                name: 'duplicator',
                count: null,
                target: null,
                mode: 'standard',
                clone_count: null,
                exception_count: null
            }),

            initialize: function() {
                ConstrainableList.prototype.initialize.apply(this, arguments);
                this.set('count', new PFloat(0));
                this.clones = [];
                this.exceptions = [];

                var clone_count = new PFloat(0);
                clone_count.setNull(false);
                this.set('clone_count', clone_count);


                var exception_count = new PFloat(0);
                exception_count.setNull(false);
                this.set('exception_count', exception_count);

            },

            setInternalConstraint: function() {
                this.internalList = new ConstrainableList();
                this.internalList.addMember(this.get('target'));
                if (this.members.length > 1) {
                    this.internalList.addMember(this.members[this.members.length - 1]);
                }
                var constraint = new Constraint();
                constraint.set('references', this.internalList);
                constraint.set('relatives', this);
                constraint.set('proxy_references', this.get('target'));
                var data = [
                    ['translationDelta_xy', 'translationDelta_xy', ['interpolate', 'interpolate']],
                    ['scalingDelta_xy', 'scalingDelta_xy', ['interpolate', 'interpolate']],
                    ['fillColor_hsl', 'fillColor_hsl', ['interpolate', 'interpolate', 'interpolate']],
                    ['strokeColor_hsl', 'strokeColor_hsl', ['interpolate', 'interpolate', 'interpolate']],
                    ['rotationDelta_v', 'rotationDelta_v', ['interpolate', 'interpolate']],
                    ['strokeWidth_v', 'strokeWidth_v', ['interpolate', 'interpolate']]
                ];
                constraint.create(data);
                return constraint;
            },

            addClone: function(clone) {
                this.clones.push(clone);
                if (this.members.length > 1) {
                    clone.setValue(this.members[this.members.length-2].getValue());
                    console.log('adding clone at ',this.members.length-1);
                    this.addCloneMember(clone, this.members.length - 1);
                } else {
                    clone.setValue(this.members[0].getValue());
                    this.addCloneMember(clone, 1);
                }
                this.get('clone_count').setValue(this.clones.length);
            },

            addCloneMember: function(clone, index) {

                this.members.splice(index, 0, clone);
                var diff = this.members.length - this.indexNumbers.length;
                for (var i = 0; i < diff; i++) {
                    var numText = new paper.PointText({
                        point: new paper.Point(0, 0),
                        content: '0',
                        justification: 'left',
                        fontSize: 12,
                        fontFamily: 'Source Sans Pro',
                        fillColor: this.get('primary_selection_color')
                    });
                    this.indexNumbers.push(numText);
                }
            },

            addMemberToOpen: function(data) {
                if (this.get('open')) {
                    var addedToList = false;
                    for (var i = 0; i < this.members.length; i++) {
                        var added = this.members[i].addMemberToOpen(data);
                        if (added) {
                            addedToList = true;
                        }
                    }
                    if (addedToList) {
                        if (data.get('type') === 'collection') {
                            for (var j = 0; j < data.members.length; j++) {
                                var removed = this.removeMember(data.members[j]);
                            }
                        }
                        return true;
                    }
                }
                return false;
            },



            addException: function(exception) {
                this.exceptions.push(exception);
                if (_.indexOf(this.clones, exception) > -1) {
                    return this.removeClone(exception);
                }
                this.addMember(exception);
                this.get('exception_count').setValue(this.exceptions.length);
            },


            deleteMember: function() {
                var data = this.clones[this.clones.length - 2];
                if (data) {
                    this.removeMember(data);
                    data.deleteSelf();
                    var parent = data.getParentNode();
                    if (parent) {
                        parent.removeInheritor(data);
                        parent.removeChildNode(data);
                    }
                    return data;
                }
            },


            deleteSelf: function() {
                ConstrainableList.prototype.deleteSelf.call(this);
                this.clones.length = 0;
                this.exceptions.length = 0;
            },

            removeMember: function(data) {
                var target = this.get('target');
                if (data != target) {
                    if (_.indexOf(this.clones, data) > -1) {
                        return this.removeClone(data);
                    } else if (_.indexOf(this.exceptions, data) > -1) {
                        return this.removeException(data);
                    }
                } else {
                    ConstrainableList.prototype.removeMember.call(this, target);
                    this.shiftTarget();
                    return target;
                }
            },


            shiftTarget: function() {
                if (this.clones.length < 1) {
                    this.setTarget();
                    return;
                }

                ConstrainableList.prototype.removeMember.call(this, this.get('target'));
                var newTarget = this.clones.splice(0, 1);
                this.set('target', newTarget);
                for (var i = 0; i < this.clones.length; i++) {
                    this.clones[i].setPrototype(newTarget);
                }

                this.get('clone_count').setValue(this.clones.length);
            },

            removeClone: function(clone) {
                var index = _.indexOf(this.clones, clone);
                if (index > -1) {
                    this.removeCloneByIndex(index);
                }
            },

            removeCloneByIndex: function(index) {
                var clone = this.clones.splice(index, 1)[0];
                var member = ConstrainableList.prototype.removeMember.call(this, clone);
                this.get('clone_count').setValue(this.clones.length);
                member.removePrototype();
                return member;
            },

            removeException: function(exception) {
                var index = _.indexOf(this.exceptions, exception);
                this.exceptions.splice(index, 1);
                var member = ConstrainableList.prototype.removeMember.call(this, exception);
                this.get('exception_count').setValue(this.exceptions.length);
                return member;
            },

            setCount: function(count) {
                this.get('count').setValue(count);
                var data;
                switch (this.get('mode')) {
                    case 'standard':
                        data = this.updateCountStandard();
                        break;
                }
                var memberCount = {
                    v: this.members.length,
                    operator: 'set'
                };
                var zIndex = this.members[0].get('zIndex').getValue();
                console.log('duplicator zindex',zIndex);
                for(var i=1;i<this.members.length;i++){

                    this.members[i].get('zIndex').setValue(i+zIndex);
                }
                this.get('memberCount').setValue(memberCount);
                return data;

            },

            getCountValue: function() {
                return this.get('count').getValue();
            },

            updateCountStandard: function() {
                var count = this.get('count').getValue();
                var range = this.get('clone_count').getValue() + 1;
                var diff = count - range;
                var target = this.get('target');

                var toRemove = [];
                var toAdd = [];
                if (diff > 0) {
                    for (var i = 0; i < diff; i++) {
                        var clone = target.create();
                        this.addClone(clone);
                        toAdd.push(clone);

                    }
                } else if (diff < 0) {
                    for (var j = 0; j < 0 - diff; j++) {
                        var member = this.deleteMember();
                        if (member) {
                            toRemove.push(member);
                        }
                    }
                }
                return {
                    toAdd: toAdd,
                    toRemove: toRemove
                };
            },

            setTarget: function(target) {
                if (target) {
                    this.set('target', target);
                    if (_.indexOf(this.members, target) < 0) {
                        this.addMember(target);
                    }
                } else {
                    this.set('target', null);
                }
            },


        });
        return Duplicator;

    });