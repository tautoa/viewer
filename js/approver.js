var VIEWER = VIEWER || {};

VIEWER.Approver = function(id, name, status, annotations) {
	"use strict";
	this.id = id;
	this.name = name;
	this.status = status;
	this.annotations = annotations || [];
};

VIEWER.Approver.prototype.addAnnotation = function(annotation) {
	"use strict";

	this.annotations.push(annotation);
	VIEWER.renderAnnotationList();
};

VIEWER.Approver.prototype.setStatus = function(status) {
	"use strict";

	this.status = status;
};
