// TODO: create option to keep templates in file stream
var utils = require('loader-utils');

module.exports = function(source){
    this.cacheable && this.cacheable();

    // get config
    var config = utils.getLoaderConfig(this, "vefaExport");
    
    if (config.use) {
        config = config[config.use];
    }

    // get the specific context involved, defaulting to Webpack's declared context
    var context = {
        context: config.context || this.options.context,
        content: source
    };

    // create the general basic filepath
    // if no extension given, default to the one sent along
    var default_path = "[path][name]." + (config.extension || "[ext]");
    var file_path = default_path;
    
    // determine if we are overriding and just using the general output functionality
    if (config.override_path) {
        // we just want to go with the general file path ascribed above.
        // or have a specific/simple new file path
        if (config.override_path.length > 1) {
            file_path = config.override_path;
        }
    }

    else {
        // processing parts
        var req_parts, folder, file, file_ext, process_path = "";
        // break up the file path into the parts that we need
        req_parts = utils.interpolateName(
            this,
            "[folder]!![path]!![name]!![ext]",
            context
        );
        req_parts = req_parts.split('!!');
        folder = req_parts[0];
        file = req_parts[2];
        file_ext = req_parts[3];
        process_path = req_parts[1];
        process_path_parts = process_path.split("/");


        // check if the export path defines variables to be interpolated
        // if it does, we don't need to worry about save_paths... ?
        if (config.export_path && config.export_path.indexOf("[") > -1) {
            file_path = config.export_path;
        } 

        // // files/folders to keep in their original pathing
        // var save_paths = config.keep_as;
        // // these are paths that we don't want to change their directories
        // if (save_paths) {
        //     var save_paths_arr = save_paths.split("|");
          
        //     if (save_paths_arr.indexOf(folder) > -1) {
        //         file_path = default_path;
        //     }
        // } 

        // // or emit only these directories
        // var only_emit = config.only_emit;
        
        // remove all directories except for these
        if (config.emit) {
            // check for a parent/base folder
            parts_check = config.emit.indexOf(process_path_parts[0]);
            // check for a full path
            path_check = config.emit.indexOf(process_path);
            // check for full path plus name
            deep_file_check = config.emit.indexOf(`${process_path}${file}`);
            file_check = config.emit.indexOf(`${file}.${file_ext}`);
            
            if ( parts_check < 0 && path_check < 0 && deep_file_check < 0 && file_check < 0) {
                file_path = "";
            } 
        }
        
        // remove certain folders from being exported out
        if (config.suppress) {
            // check for a parent/base folder
            parts_check = config.suppress.indexOf(process_path_parts[0]);
            // check for a full path
            path_check = config.suppress.indexOf(process_path);
            // check for full path plus name
            deep_file_check = config.suppress.indexOf(`${process_path}${file}`);

            if ( parts_check >= 0 || path_check >= 0 || deep_file_check >= 0) {
                file_path = "";
            }
        }

        // lets make a certain page the homepage if we can
        if (config.homepage) {
            if (config.homepage == [process_path, file].join("") ) {
                file_path = "index.html";
            }
        }
    }


    // lets sub out all the placeholders
    var file = utils.interpolateName(
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