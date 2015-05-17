var VIEWER = VIEWER || {};

VIEWER.Annotation = function(approverId, text, left, top, width, height) {
	"use strict";
	this.approverId = approverId;
	this.text = text;
	this.added = moment();
	this.left = left;
	this.top = top;
	this.width = width;
	this.height = height;
};

VIEWER.Annotation.prototype.editAnnotation = function(event) {
	var annotation = this;
	$("<textarea />").blur(function(event) {
		annotation.saveAnnotationText(event);
	}).val(this.text).appendTo($(event.target).parent()).focus();
	$(event.target).remove();
};

VIEWER.Annotation.prototype.saveAnnotationText = function(event) {
	if (event.target.value) {
		this.text = event.target.value;
		$("<span>", {
			"class": "annotationText",
			"text": this.text
		}).appendTo($(event.target).parent());
		$(event.target).parent().click(function(event) {
			this.editAnnotation(event);
		});
		$(event.target).remove();
	} else {
		$(event.target).parent().remove();
	}

	VIEWER.renderAnnotationList();
};
