/*jslint browser: true*/
/*global $, jQuery, alert, COMMON*/

var VIEWER = VIEWER || {};

/*
    Properties
*/

VIEWER.approvers = [];          	// Collection of approvers for this document.
VIEWER.ApprovalStatus = Object.freeze(new COMMON.Enum("PENDING", "APPROVED", "REJECTED"));
VIEWER.createAnnotations = false;	// Indicates whether annotations will be created when the document is clicked.
VIEWER.currentApprover = null;  	// Reference to the current approver in the approvers array.

/*
	Objects
*/

VIEWER.Annotation = function (approverId, text, left, top, width, height) {
	"use strict";
	this.approverId = approverId;
    this.text = text;
    this.left = left;
	this.top = top;
    this.width = width;
    this.height = height;
};

VIEWER.Annotation.prototype.editAnnotation = function(event){
	var annotation = this;
	$("<textarea />").blur(function (event) {annotation.saveAnnotationText(event);}).val(this.text).appendTo($(event.target).parent()).focus();
	$(event.target).remove();
};

VIEWER.Annotation.prototype.saveAnnotationText = function(event){
	if (event.target.value) {
		this.text = event.target.value;
		$("<span>", {
			"class": "annotationText",
			"text": this.text
		}).appendTo($(event.target).parent());
		$(event.target).parent().click(function(event){this.editAnnotation(event);});
		$(event.target).remove();
	}
	else {
		$(event.target).parent().remove();
	}
	
    VIEWER.renderAnnotationList();
};

VIEWER.Approver = function (id, name, status, annotations) {
    "use strict";
    this.id = id;
    this.name = name;
    this.status = status;
    this.annotations = annotations || [];
};

VIEWER.Approver.prototype.addAnnotation = function (annotation) {
	"use strict";
	
	this.annotations.push(annotation);
    VIEWER.renderAnnotationList();
};

VIEWER.renderApproverList = function (approversList) {
    "use strict";

    var i,
        approversListHTML = "<table>";

    for (i = 0; i < approversList.length; i += 1) {
        approversListHTML += "<tr><td><input type='checkbox' id=" + approversList[i].id + " onchange='VIEWER.toggleAnnotations(this.checked," + approversList[i].id + ")' checked/></td>";
		approversListHTML += "<td>" + approversList[i].name + "</td><td>" + VIEWER.ApprovalStatus.keys[approversList[i].status] + "</td></tr>";
    }

    approversListHTML += "</table>";

    return approversListHTML;
};

VIEWER.renderAnnotations = function (approversList) {
	"use strict";
	var i = 0;
	var x = 0;
	var annotationDiv = $("<div />", {
            "class": "annotation"
        });
	for (i = 0; i < approversList.length; i += 1) {
		for (x = 0; x < approversList[i].annotations.length; x += 1){
			annotationDiv = annotationDiv.clone().css({
		        "left": approversList[i].annotations[x].left,
		        "top": approversList[i].annotations[x].top,
		        "width": approversList[i].annotations[x].width,
		        "height": approversList[i].annotations[x].height
		    }).attr('id', 'div_' + approversList[i].id + '_' + x);
		    annotationDiv.appendTo(".imageContainer");
			$("<span>", {
                    "class": "annotationText",
                    "text": approversList[i].annotations[x].text
                }).appendTo(annotationDiv);
		
		}
	}
};

VIEWER.renderAnnotationList = function(){
	"use strict";
	
	$("#annotationList").empty();
	
	$.map(VIEWER.approvers, function(approver){
		$.map(approver.annotations, function(annotation){
			$("#annotationList").append($("<div />").text(annotation.text + " by " + approver.name));
		});
	});
	
};

VIEWER.setCurrentApproverStatus = function (status) {
    "use strict";
    VIEWER.currentApprover.setStatus(status);

    // Re-render the approver list to show the new status.
    $("#approversList").html(VIEWER.renderApproverList(VIEWER.approvers));
};

VIEWER.Approver.prototype.setStatus = function (status) {
    "use strict";

    this.status = status;
};

VIEWER.toggleAnnotateTool = function(caller){
	"use strict";
	VIEWER.createAnnotations = !VIEWER.createAnnotations;
	if (VIEWER.createAnnotations)
		$(caller).addClass("active");
	else
		$(caller).removeClass("active");
};

VIEWER.toggleAnnotations = function (checked, approverId) {
	$("[id^=div_" + approverId + "_]").toggle(checked);
};

$(document).ready(function () {
    "use strict";

    var	dragging = false,
        newDiv = $("<div />", {
            "class": "annotation"
        }),
        startX,
        startY;

    // Add test data.
	VIEWER.approvers.push(new VIEWER.Approver("3035", "Jon Collins", VIEWER.ApprovalStatus.PENDING, []));
    VIEWER.currentApprover = VIEWER.approvers[0];
    VIEWER.approvers.push(new VIEWER.Approver("3036", "Andrew Bohling", VIEWER.ApprovalStatus.PENDING, []));
	var newAnnotation = new VIEWER.Annotation(3036, 'Test', '388.8px', '209.8px', '260px', '115px');
	VIEWER.approvers[1].addAnnotation(newAnnotation);
	
	VIEWER.renderAnnotations(VIEWER.approvers);

    $("#approversList").html(VIEWER.renderApproverList(VIEWER.approvers));

    $(".imageContainer").mousedown(function (e) {
    	if (VIEWER.createAnnotations){
			var offset = $(this).offset();
			startX = e.pageX - offset.left;
			startY = e.pageY - offset.top;

		    dragging = true;

		    newDiv = newDiv.clone().css({
		        "left": startX,
		        "top": startY,
		        "width": 0,
		        "height": 0
		    }).text("");
		    newDiv.appendTo(".imageContainer");
        }
    });

    $(".imageContainer").mousemove(function (e) {
        if (dragging) {
			var offset = $(this).offset();
            var endX = e.pageX - offset.left;
            var endY = e.pageY - offset.top;

            newDiv.css({
                "left": Math.min(startX, endX),
                "top": Math.min(startY, endY),
                "width": Math.abs(endX - startX),
                "height": Math.abs(endY - startY)
            });
        }
    });

    $(".imageContainer").mouseup(function () {
        $("<textarea />").blur(function () {
            var annotationText = this.value;
            if (annotationText) {
				
				var newAnnotation = new VIEWER.Annotation(VIEWER.currentApprover.id, annotationText, $(this).parent().css("left"), $(this).parent().css("top"), $(this).parent().css("width"), $(this).parent().css("height"));
				VIEWER.currentApprover.addAnnotation(newAnnotation);
				
                $("<span>", {
                    "class": "annotationText",
                    "text": this.value
                }).appendTo($(this).parent());
				$(this).parent().click(function(event){newAnnotation.editAnnotation(event);});
                $(this).remove();
            } else {
                $(this).parent().remove();
            }
        }).appendTo(newDiv).focus();
		newDiv.attr('id', 'div_' + VIEWER.currentApprover.id + '_' + VIEWER.currentApprover.annotations.length);

        dragging = false;
    });
    
    VIEWER.renderAnnotationList();
});

var currentRotationAngle = 0;

function rotateElement(element, angleInDegrees) {
    "use strict";

    var //angle = angleInDegrees * Math.PI / 180,
        //sin = Math.sin(angle),
        //cos = Math.cos(angle),
        $element = $($("#" + element)[0] || $("." + element)[0]);

    currentRotationAngle += angleInDegrees;

    $element.css({
        "-webkit-transform": "rotate(" + currentRotationAngle + "deg)",
        "-moz-transform": "rotate(" + currentRotationAngle + "deg)",
        "-ms-transform": "rotate(" + currentRotationAngle + "deg)",
        "-o-transform": "rotate(" + currentRotationAngle + "deg)",
        "transform": "rotate(" + currentRotationAngle + "deg)"
    });

    $element.find(".annotationText").css({
        "-webkit-transform": "rotate(" + -currentRotationAngle + "deg)",
        "-moz-transform": "rotate(" + -currentRotationAngle + "deg)",
        "-ms-transform": "rotate(" + -currentRotationAngle + "deg)",
        "-o-transform": "rotate(" + -currentRotationAngle + "deg)",
        "transform": "rotate(" + -currentRotationAngle + "deg)"
    });

    /*

    // (0,0) stays as (0, 0)

    // (w,0) rotation
    var x1 = cos * $element.height(),
        y1 = sin * $element.width();

    // (0,h) rotation
    var x2 = -sin * $element.height(),
        y2 = cos * $element.height();

    // (w,h) rotation
    var x3 = cos * $element.width() - sin * $element.height(),
        y3 = sin * $element.width() + cos * $element.height();

    var minX = Math.min(0, x1, x2, x3),
        maxX = Math.max(0, x1, x2, x3),
        minY = Math.min(0, y1, y2, y3),
        maxY = Math.max(0, y1, y2, y3);

    var rotatedWidth  = maxX - minX,
        rotatedHeight = maxY - minY;

    $element.css({
        "height": rotatedHeight,
        "width": rotatedWidth
    });
    */
}
