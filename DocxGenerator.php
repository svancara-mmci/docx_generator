<?php
namespace MMCI\DocxGenerator;

use ExternalModules\AbstractExternalModule;

class DocxGenerator extends AbstractExternalModule
{
    function redcap_every_page_top($project_id = null)
    {
        if (!$project_id) return;
        if (PAGE !== 'DataEntry/index.php') return;

        $instrument = $_GET['page'] ?? '';
        $target = $this->getProjectSetting('target_instrument');
        if (!empty($target) && $instrument !== $target) return;

        // No template uploaded -> no button
        if (empty($this->getProjectSetting('template_file'))) return;

        $jsonFields = $this->getProjectSetting('json_fields');
        if (!is_array($jsonFields)) $jsonFields = array();
        $jsonFields = array_values(array_filter($jsonFields));

        $config = array(
            'templateUrl'    => $this->getUrl('template.php'),
            'filenameField'  => $this->getProjectSetting('filename_field') ?: '',
            'filenameSuffix' => $this->getProjectSetting('filename_suffix') ?: 'export',
            'buttonLabel'    => $this->getProjectSetting('button_label') ?: 'Generate Word document',
            'jsonFields'     => $jsonFields,
            'meta'           => $this->buildFieldMeta($project_id)
        );

        // Inline config only (no backticks!), libraries + logic as external files
        echo '<script>window.DTG_CONFIG = ' . json_encode($config, JSON_UNESCAPED_UNICODE) . ';</script>' . "\n";
        echo '<script src="' . $this->getUrl('js/vendor/pizzip.min.js') . '"></script>' . "\n";
        echo '<script src="' . $this->getUrl('js/vendor/docxtemplater.min.js') . '"></script>' . "\n";
        echo '<script src="' . $this->getUrl('js/vendor/FileSaver.min.js') . '"></script>' . "\n";
        echo '<script src="' . $this->getUrl('js/generator.js') . '"></script>' . "\n";
    }

    /**
     * Field metadata from the data dictionary -> JS maps stored codes to labels.
     * Changes to project choice lists propagate automatically.
     */
    private function buildFieldMeta($project_id)
    {
        $dd = \REDCap::getDataDictionary($project_id, 'array');
        $meta = array();

        foreach ($dd as $field => $def) {
            $type = $def['field_type'];
            $choices = array();

            if ($type === 'yesno') {
                $choices = array('1' => 'Yes', '0' => 'No');
            } elseif ($type === 'truefalse') {
                $choices = array('1' => 'True', '0' => 'False');
            } elseif (in_array($type, array('dropdown', 'radio', 'checkbox'))) {
                foreach (explode('|', $def['select_choices_or_calculations']) as $pair) {
                    $parts = explode(',', $pair, 2);
                    if (count($parts) === 2) {
                        $choices[trim($parts[0])] = trim($parts[1]);
                    }
                }
            }

            $meta[$field] = array('type' => $type, 'choices' => (object)$choices);
        }
        return $meta;
    }
}
