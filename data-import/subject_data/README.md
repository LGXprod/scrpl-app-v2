# Subject Data

To run the `import_subjects.ipynb` notebook, the following data is required it be placed in this directory (`./subject_data`):
- `embeddings/`: a directory which contains the subject document embeddings in JSON, organised in directories by university (use the abbreviation of the university).
- `markdown/`: markdown files for each subject (doesn't need to be organised into university directories).
- `subject_to_degrees.json`
- `subject_to_majors.json`
- `subject_code_to_name.json`: If this file doesn't exist but all subject markdown files are available, the `get_subject_names.ipynb` notebook can be ran to generate this JSON file.
