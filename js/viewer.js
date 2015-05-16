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

VIEWER.Annotation = function (text, origin, width, height) {
	"use strict";
    this.text = text;
    this.origin = origin || { x: 0, y: 0};
    this.width = width;
    this.height = height;
};

VIEWER.Approver = function (id, name, status, annotations) {
    "use strict";
    this.id = id;
    this.name = name;
    this.status = status;
    this.annotations = annotations || [];
};

VIEWER.Approver.prototype.setStatus = function (status) {
    "use strict";

    this.status = status;
};

VIEWER.renderApproverList = function (approversList) {
    "use strict";

    var i,
        approversListHTML = "<table>";

    for (i = 0; i < approversList.length; i += 1) {
        approversListHTML += "<tr><td>" + approversList[i].name + "</td><td>" + VIEWER.ApprovalStatus.keys[approversList[i].status] + "</td></tr>";
    }

    approversListHTML += "</table>";

    return approversListHTML;
};

VIEWER.setCurrentApproverStatus = function (status) {
    "use strict";
    VIEWER.currentApprover.setStatus(status);

    // Re-render the approver list to show the new status.
    $("#approversList").html(VIEWER.renderApproverList(VIEWER.approvers));
};

VIEWER.toggleAnnotateTool = function(caller){
	"use strict";
	VIEWER.createAnnotations = !VIEWER.createAnnotations;
	if (VIEWER.createAnnotations)
		$(caller).addClass("active");
	else
		$(caller).removeClass("active");
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
        $("<input />", {
            "type": "text"
        }).blur(function () {
            var annotationText = this.value;
            if (annotationText) {
                $("<span>", {
                    "class": "annotationText",
                    "text": this.value
                }).appendTo($(this).parent());
                $(this).remove();
            } else {
                $(this).parent().remove();
            }
        }).appendTo(newDiv).focus();

        dragging = false;
    });
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
