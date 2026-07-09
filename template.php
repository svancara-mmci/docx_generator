<?php
namespace MMCI\DocxGenerator;

/** @var DocxTemplateGenerator $module */

$edocId = $module->getProjectSetting('template_file');
if (empty($edocId)) {
    http_response_code(404);
    exit('No template uploaded in module settings.');
}

list($mimeType, $docName, $contents) = \REDCap::getFile($edocId);

header('Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document');
header('Content-Disposition: attachment; filename="template.docx"');
header('Content-Length: ' . strlen($contents));
echo $contents;
