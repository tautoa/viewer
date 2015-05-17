var VIEWER = VIEWER || {};

/*
	Properties
*/

VIEWER.approvers = []; // Collection of approvers for this document.
VIEWER.ApprovalStatus = Object.freeze(new COMMON.Enum("PENDING", "APPROVED", "REJECTED"));
VIEWER.createAnnotations = false; // Indicates whether annotations will be created when the document is clicked.
VIEWER.currentApprover = null; // Reference to the current approver in the approvers array.

/*
	Objects
*/

VIEWER.renderApproverList = function(approversList) {
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

VIEWER.renderAnnotations = function(approversList) {
	"use strict";

	$(".annotation").remove();
	var i = 0;
	var x = 0;
	var annotationDiv = $("<div />", {
		"class": "annotation"
	});

	var divLeft = $(".imageContainer").offset().left;
	var divTop = $(".imageContainer").offset().top;

	var imageLeft = $(".viewerImage").offset().left - divLeft;
	var imageTop = $(".viewerImage").offset().top - divTop;
	var imageWidth = $(".viewerImage").width();
	var imageHeight = $(".viewerImage").height();

	for (i = 0; i < approversList.length; i += 1) {
		for (x = 0; x < approversList[i].annotations.length; x += 1) {
			var annotation = approversList[i].annotations[x];
			var annotationObj = annotationDiv.clone().css({
				"left": (annotation.left * imageWidth) + imageLeft,
				"top": (annotation.top * imageHeight) + imageTop,
				"width": annotation.width * imageWidth,
				"height": annotation.height * imageHeight
			}).attr('id', 'div_' + approversList[i].id + '_' + x);
			annotationObj.click((function(annotation) {
				return function(event) {
					annotation.editAnnotation(event);
				};
			})(annotation));
			annotationObj.appendTo(".imageContainer");
			$("<span>", {
				"class": "annotationText",
				"text": annotation.text
			}).appendTo(annotationObj);
		}
	}
};

VIEWER.renderAnnotationList = function() {
	"use strict";

	$("#annotationList").empty();

	$.map(VIEWER.approvers, function(approver) {
		$.map(approver.annotations, function(annotation) {
			$("#annotationList").append($("<div />").html(annotation.text + "<br />Added by " + approver.name + " " + annotation.added.fromNow()));
		});
	});

};

VIEWER.setCurrentApproverStatus = function(status) {
	"use strict";
	VIEWER.currentApprover.setStatus(status);

	// Re-render the approver list to show the new status.
	$("#approversList").html(VIEWER.renderApproverList(VIEWER.approvers));
};

VIEWER.toggleAnnotateTool = function(caller) {
	"use strict";
	VIEWER.createAnnotations = !VIEWER.createAnnotations;
	if (VIEWER.createAnnotations)
		$(caller).addClass("active");
	else
		$(caller).removeClass("active");
};

VIEWER.toggleAnnotations = function(checked, approverId) {
	$("[id^=div_" + approverId + "_]").toggle(checked);
};

$(document).ready(function() {
	"use strict";

	var dragging = false,
		newDiv = $("<div />", {
			"class": "annotation"
		}),
		startX,
		startY;

	$(window).resize(function() {
		VIEWER.renderAnnotations(VIEWER.approvers)
	});

	// Add test data.
	VIEWER.approvers.push(new VIEWER.Approver("3035", "Jon Collins", VIEWER.ApprovalStatus.PENDING, []));
	VIEWER.currentApprover = VIEWER.approvers[0];
	VIEWER.approvers.push(new VIEWER.Approver("3036", "Andrew Bohling", VIEWER.ApprovalStatus.PENDING, []));
	var newAnnotation = new VIEWER.Annotation(3036, 'Test', 0.25, 0.5, 0.26, 0.10);

	VIEWER.approvers[1].addAnnotation(newAnnotation);

	VIEWER.renderAnnotations(VIEWER.approvers);

	$("#approversList").html(VIEWER.renderApproverList(VIEWER.approvers));
	$('.viewerImage').on('dragstart', function(event) {
		event.preventDefault();
	});
	$(".imageContainer").mousedown(function(e) {
		if (VIEWER.createAnnotations) {
			// Get the cursor's position relative to the window.
			var mouseX = e.pageX,
				mouseY = e.pageY;

			// Get the containing div's position relative to the page.
			var divPosition = $(".imageContainer").offset(),
				divX = divPosition.left,
				divY = divPosition.top;

			dragging = true;

			startX = mouseX - divX;
			startY = mouseY - divY;

			newDiv = newDiv.clone().css({
				"left": startX,
				"top": startY,
				"width": 0,
				"height": 0
			}).text("");
			newDiv.appendTo(".imageContainer");
		}
	});

	$(".imageContainer").mousemove(function(e) {
		if (dragging) {
			// Get the cursor's position relative to the window.
			var mouseX = e.pageX,
				mouseY = e.pageY;

			// Get the containing div's position relative to the page.
			var divPosition = $(".imageContainer").offset(),
				divX = divPosition.left,
				divY = divPosition.top;

			var endX = mouseX - divX;
			var endY = mouseY - divY;
			/*
			var containerHeight = $('.viewerImage').height();
			var containerWidth = $('.viewerImage').width();
			var LeftX = parseInt(Math.min(startX + offset.left, e.pageX));
			var LeftY = parseInt(Math.min(startY + offset.top, e.pageY));
			var RightX = parseInt(Math.max(startX + offset.left, e.pageX));
			var RightY = parseInt(Math.max(startY + offset.top, e.pageY));
			var LXpercent = 100 * LeftX / containerWidth;
			var LYpercent = 100 * LeftY / containerHeight;
			var RXpercent = 100 * (RightX - LeftX) / containerWidth;
			var RYpercent = 100 * (RightY - LeftY) / containerHeight;
			*/
			newDiv.css({
				"left": Math.min(startX, endX),
				"top": Math.min(startY, endY),
				"width": Math.abs(endX - startX),
				"height": Math.abs(endY - startY)
			});
		}
	});

	$(".imageContainer").mouseup(function() {
		$("<textarea />").blur(function() {
			var annotationText = this.value;
			if (annotationText) {

				// Get the annotation position and dimensions.
				var annotationLeft = $(this).parent().offset().left;
				var annotationTop = $(this).parent().offset().top;
				var annotationWidth = $(this).parent().width();
				var annotationHeight = $(this).parent().height();

				// Turn the annotation position and dimensions into percentages of the image position and dimensions.
				var imageLeft = $(".viewerImage").offset().left;
				var imageTop = $(".viewerImage").offset().top;
				var imageWidth = $(".viewerImage").width();
				var imageHeight = $(".viewerImage").height();

				var annotationLeftPercent = (annotationLeft - imageLeft) / imageWidth;
				var annotationTopPercent = (annotationTop - imageTop) / imageHeight;
				var annotationWidthPercent = annotationWidth / imageWidth;
				var annotationHeightPercent = annotationHeight / imageHeight;

				var newAnnotation = new VIEWER.Annotation(VIEWER.currentApprover.id, annotationText, annotationLeftPercent, annotationTopPercent, annotationWidthPercent, annotationHeightPercent);
				VIEWER.currentApprover.addAnnotation(newAnnotation);

				$("<span>", {
					"class": "annotationText",
					"text": this.value
				}).appendTo($(this).parent());
				$(this).parent().click(function(event) {
					newAnnotation.editAnnotation(event);
				});
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
