$(document).ready(function () {
    var cfg = window.DTG_CONFIG;
    if (!cfg) return;

    if ($('#dtgGenerateBtn').length === 0) {
        var btn = '<button type="button" id="dtgGenerateBtn" class="btn btn-primary" style="margin:10px;">'
                + '<i class="fas fa-file-word"></i> ' + cfg.buttonLabel + '</button>';
        $('#form').prepend(btn);
    }

    $(document).on('click', '#dtgGenerateBtn', generateDocument);
});

function generateDocument() {
    var cfg = window.DTG_CONFIG;
    showLoadingMessage('Loading template and generating document...');

    fetch(cfg.templateUrl)
        .then(function (response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.blob();
        })
        .then(function (blob) { return blob.arrayBuffer(); })
        .then(function (buffer) {
            var data = collectFormData(cfg);
            var zip = new PizZip(buffer);
            var doc = new window.docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                nullGetter: function () { return ''; }   // undefined placeholders -> empty string
            });

            doc.render(data);

            var output = doc.getZip().generate({
                type: 'blob',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });

            var now = new Date();
            var ts = now.getFullYear()
                + String(now.getMonth() + 1).padStart(2, '0')
                + String(now.getDate()).padStart(2, '0') + '_'
                + String(now.getHours()).padStart(2, '0')
                + String(now.getMinutes()).padStart(2, '0');

            var prefix = (cfg.filenameField && data[cfg.filenameField]) ? data[cfg.filenameField] : 'record';
            saveAs(output, prefix + '_' + cfg.filenameSuffix + '_' + ts + '.docx');
        })
        .catch(function (error) {
            console.error('Document generation failed:', error);
            if (error.properties && error.properties.errors) {
                var msgs = error.properties.errors.map(function (e) { return e.message; }).join('\n');
                alert('Template error:\n' + msgs);
            } else {
                alert('Document generation failed: ' + error.message);
            }
        })
        .finally(hideLoadingMessage);
}

// Generic form data collection driven by data dictionary metadata
function collectFormData(cfg) {
    var data = {};
    var meta = cfg.meta || {};

    Object.keys(meta).forEach(function (field) {
        var m = meta[field];

        if (m.type === 'checkbox') {
            // REDCap checkboxes: __chkn__<field>, code stored in the "code" attribute
            var labels = [];
            $('input[name="__chkn__' + field + '"]:checked').each(function () {
                var code = $(this).attr('code');
                if (m.choices[code]) labels.push(m.choices[code]);
            });
            data[field] = labels.join(', ');
            return;
        }

        // radio, dropdown, yesno, truefalse: stored value lives in input[name=field] / select
        var $el = $('[name="' + field + '"]').first();
        if ($el.length === 0) return;

        var val = $el.val();
        if (val === null || val === undefined) val = '';

        if (m.choices && m.choices[val] !== undefined) {
            data[field] = m.choices[val];      // code -> label
        } else {
            data[field] = val;                 // text, notes, date, calc...
        }
    });

    // Generation timestamp placeholders
    var today = new Date();
    data.current_date = today.toLocaleDateString();
    data.current_datetime = today.toLocaleString();

    // Configured JSON fields: array of objects -> one line per item
    (cfg.jsonFields || []).forEach(function (field) {
        formatJsonField(data, field);
    });

    return data;
}

// Generic formatter: joins non-empty scalar values of each object with ", "
function formatJsonField(data, field) {
    if (!data[field]) return;
    try {
        var items = JSON.parse(data[field]);
        if (!Array.isArray(items)) return;
        data[field] = items.map(function (item) {
            if (item === null || typeof item !== 'object') return String(item);
            return Object.keys(item).map(function (key) {
                var v = item[key];
                if (v === null || v === undefined || v === '') return null;
                if (typeof v === 'object') {
                    // nested object (e.g. {value, label}) -> prefer label
                    return v.label !== undefined ? v.label : JSON.stringify(v);
                }
                return String(v);
            }).filter(Boolean).join(', ');
        }).join('\n');
    } catch (e) {
        console.warn('Cannot parse JSON field ' + field + ':', e);
    }
}

function showLoadingMessage(msg) {
    if ($('#dtgLoading').length === 0) {
        $('body').append('<div id="dtgLoading" style="position:fixed;top:20px;right:20px;'
            + 'background:#333;color:#fff;padding:12px 20px;border-radius:6px;z-index:9999;">'
            + msg + '</div>');
    }
}

function hideLoadingMessage() {
    $('#dtgLoading').remove();
}
