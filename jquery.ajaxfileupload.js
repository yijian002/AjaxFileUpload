(function($) {
    "use strict";

    $.extend({
        createUploadIframe: function(id, uri) {
            var frameId = 'jUploadFrame' + id;

            var io = $('<iframe id="' + frameId + '" name="' + frameId + '" />');
            if (window.ActiveXObject) {                
                if (typeof uri === 'boolean') {
                    io.attr({src: 'javascript:false'});
                } else if (typeof uri === 'string') {
                    io.attr({src: uri});
                }
            }

            io.css({
                position: 'absolute',
                top: '-9000px',
                left: '-9000px'
            }).appendTo('body');

            return io;
        },
        createUploadForm: function(id, fileElementId) {
            var formId = 'jUploadForm' + id;
            // var fileId = 'jUploadFile' + id;
            var form = $('<form  action="" method="POST" name="' + formId + '" id="' + formId + '" enctype="multipart/form-data"></form>');
            var oldElement = $('#' + fileElementId);
            var newElement = $(oldElement).clone();

            // $(oldElement).attr('id', fileId).before(newElement).appendTo(form);
            $(newElement).appendTo(form);
            $(form).css({ position: 'absolute', top: -9999, left: -9999 }).appendTo('body');

            return form;
        },
        addOtherRequestsToForm: function(form, data) {
            var originalElement = $('<input type="hidden" name="" value="" />');
            for (var key in data) {
                name = key;
                value = data[key];
                var cloneElement = originalElement.clone();
                cloneElement.attr({ 'name': name, 'value': value });
                $(cloneElement).appendTo(form);
            }
            return form;
        },

        ajaxFileUpload: function(s) {
            s = $.extend({}, $.ajaxSettings, s);
            var id = new Date().getTime();
            var form = $.createUploadForm(id, s.fileElementId);

            if (s.data) {
                form = $.addOtherRequestsToForm(form, s.data);
            }

            var io = $.createUploadIframe(id, s.secureuri);
            var frameId = 'jUploadFrame' + id;
            var formId = 'jUploadForm' + id;
            // Watch for a new set of requests
            if (s.global && !$.active++) {
                $.event.trigger("ajaxStart");
            }
            var requestDone = false;
            // Create the request object
            var xml = {};
            if (s.global) {
                $.event.trigger("ajaxSend", [xml, s]);
            }

            function uploadCallback(isTimeout) {
                var io = document.getElementById(frameId);
                try {
                    if (io.contentWindow) {
                        xml.responseText = io.contentWindow.document.body ? io.contentWindow.document.body.innerHTML : null;
                        xml.responseXML = io.contentWindow.document.XMLDocument ? io.contentWindow.document.XMLDocument : io.contentWindow.document;
                    } else if (io.contentDocument) {
                        xml.responseText = io.contentDocument.document.body ? io.contentDocument.document.body.innerHTML : null;
                        xml.responseXML = io.contentDocument.document.XMLDocument ? io.contentDocument.document.XMLDocument : io.contentDocument.document;
                    }
                } catch (e) {
                    $.handleError(s, xml, null, e);
                }

                if (xml || isTimeout == "timeout") {
                    requestDone = true;
                    var status;
                    try {
                        status = isTimeout != "timeout" ? "success" : "error";
                        // Make sure that the request was successful or notmodified
                        if (status != "error") {
                            // process the data (runs the xml through httpData regardless of callback)
                            var data = $.uploadHttpData(xml, s.dataType);
                            // If a local callback was specified, fire it and pass it the data
                            if (s.success) {
                                s.success(data, status);
                            }

                            // Fire the global callback
                            if (s.global) {
                                $.event.trigger("ajaxSuccess", [xml, s]);
                            }
                        } else {
                            $.handleError(s, xml, status);
                        }

                    } catch (e) {
                        status = "error";
                        $.handleError(s, xml, status, e);
                    }

                    // The request was completed
                    if (s.global) {
                        $.event.trigger("ajaxComplete", [xml, s]);
                    }

                    // Handle the global AJAX counter
                    if (s.global && !--$.active) {
                        $.event.trigger("ajaxStop");
                    }

                    // Process result
                    if (s.complete) {
                        s.complete(xml, status);
                    }

                    $(io).off();

                    try {
                        setTimeout(function() {
                            $(io).remove();
                            $(form).remove();
                        }, 100);
                    } catch (e) {
                        $.handleError(s, xml, null, e);
                    }

                    xml = null;
                }
            }

            if (s.timeout > 0) {
                setTimeout(function() {
                    if (!requestDone) {
                        uploadCallback('timeout');
                    }
                }, s.timeout);
            }

            try {
                var $form = $('#' + formId).attr({ action: s.url, method: 'POST', target: frameId });
                if ($form.encoding) {
                    $form.encoding = 'multipart/form-data';
                } else {
                    $form.enctype = 'multipart/form-data';
                }
                $form.submit();
            } catch (e) {
                $.handleError(s, xml, null, e);
            }

            if (window.attachEvent) {
                document.getElementById(frameId).attachEvent('onload', uploadCallback);
            } else {
                document.getElementById(frameId).addEventListener('load', uploadCallback, false);
            }

            return { abort: function() {} };
        },

        uploadHttpData: function(r, type) {
            var data = !type;
            data = type == 'xml' || data ? r.responseXML : r.responseText;

            if (type == 'script') {
                $.globalEval(data);
            } else if (type == 'json') {
                data = r.responseText;
                var start = data.indexOf('>');
                if (start >= 0) {
                    var end = data.indexOf('<', start + 1);
                    if (end >= 0) {
                        data = data.substring(start + 1, end);
                    }
                }

                try {
                    data = JSON.parse(data);
                } catch (e) {
                    $.handleError('Response data error.', data, null, e);
                }
            } else if (type == 'html') {
                $('<div>').html(data).evalScripts();
            }

            return data;
        },

        handleError: function(s, xml, st, e) {
            if (console && console.error) {
                console.error(s, xml, st, e);
            }
        }
    });
}(jQuery));
