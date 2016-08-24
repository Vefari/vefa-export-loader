// TODO: create option to keep templates in file stream

var loader_utils = require('loader-utils');

module.exports = function(source){
    this.cacheable && this.cacheable();

    // get the options contained in the query
    var query = loader_utils.parseQuery(this.query);
    
    // get the extra options not contained in the query
    var opts = this.options.exportTemplate;
    
    // determine if we are overriding and just using the general output functionality
    var override = query.override || query.name || false;
    
    // get the specific context involved, defaulting to Webpack's declared context
    var context = {
        context: query.context || opts.context || this.options.context,
        content: source
    };
    
    // define a specific extension either through the query or through the options
    // if no extension given, default to the one sent aong
    var extension = query.extension || opts.extension || "[ext]";
    
    // create the general basic filepath
    var default_path = "[path][name]." + extension;
    var file_path = default_path;

    if (override) {
        // we just want to go with the general file path ascribed above.
        // or have a specific/simple new file path
        if (override.length > 1) {
            file_path = override;
        }
    }

    else {
        // processing parts
        var req_parts, folder, file, process_path = "";
        // break up the file path into the parts that we need
        req_parts = loader_utils.interpolateName(
            this,
            "[folder]!![path]!![name]",
            context
        );
        req_parts = req_parts.split('!!');
        folder = req_parts[0];
        file = req_parts[2];
        process_path = req_parts[1];
        process_path_parts = process_path.split("/");

        // path to change files/folders to, if null, lets not change the file_path
        var export_path = query.export_to || opts.export_to;
        // check if the export path defines variables to be interpolated
        // if it does, we don't need to worry about save_paths... ?
        if (export_path && export_path.indexOf("[") > -1) {
            file_path = export_path;
        } 

        // files/folders to keep in their original pathing
        var save_paths = query.keep_as || opts.keep_as;
        // these are paths that we don't want to change their directories
        if (save_paths) {
            var save_paths_arr = save_paths.split("|");
          
            if (save_paths_arr.indexOf(folder) > -1) {
                file_path = default_path;
            }
        } 


        // don't emit these directories
        var no_emit = query.no_emit || opts.no_emit;
        // or emit only these directories
        var only_emit = query.only_emit || opts.only_emit;
        
        // remove all directories except for these
        if (only_emit) {
            var emit_folders = only_emit.split("|");

            // check for a parent/base folder
            parts_check = emit_folders.indexOf(process_path_parts[0]);
            // check for a full path
            path_check = emit_folders.indexOf(process_path);
            
            if ( parts_check < 0 && path_check < 0) {
                file_path = "";
            } 
        }
        // remove certain folders from being exported out
        else if (no_emit) {
            var no_emit_folders = no_emit.split("|");

            // check for a parent/base folder
            if (no_emit_folders.indexOf(process_path_parts[0]) >= 0) {
                file_path = "";
            }

            // check for a full path
            if (no_emit_folders.indexOf(process_path) >= 0) {
                file_path = "";
            }

        }

        // lets make a certain page the homepage if we can
        var make_home = query.homepage || opts.homepage;
        if (make_home) {
            if (make_home == [process_path, file].join("") ) {
                file_path = "index.html";
            }
        }
    }


    // lets sub out all the placeholders
    var file = loader_utils.interpolateName(
        this,
        file_path,
        context
    );

    // output the file and remove it from the stream as we don't need it anymore.
    if (file_path !== "") {
        this.emitFile(file, source);
    }

    return "";
}