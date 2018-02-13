'use strict'
let utils = require('loader-utils');

module.exports = function(source){
    this.cacheable && this.cacheable();

    // get config
    let config = utils.getOptions(this);

    
    // get the specific context involved, defaulting to Webpack's declared context
    let context = {
        context: config.context,
        content: source.content ? source.content : source
    };

    // create the general basic filepath
    // if no extension given, default to the one sent along
    let default_path = "[path][name]." + (config.extension || "[ext]");
    let file_path = default_path;
    
    // stop processing files if we set bypass_export flag
    if (!config.bypass_export) {

        // if source.content, we're dealing with Markdown pages
        if (source.content) {
            // if clean_urls, make the file_path a directory based system
            if ( config.clean_urls) {
                file_path = '[path][name]/index.html'

                if (source.data.slug) {
                    file_path = `${source.resourcePath}/index.html`
                }
            }
            else {
                file_path = `${source.resourcePath}.html`
            }

            // set up if dynamic server based,
            // set up some specific pages,
            // remove pathing and force it
            file_path = (config.homepage == source.resourcePath) ? "index.html" : file_path
            file_path = (config['404'] == source.resourcePath) ? "404.html" : file_path
            file_path = (config['500'] == source.resourcePath) ? "500.html" : file_path

            const isPostProcess = (config.django && source.data && source.data.postprocess)
            const isPostSuppressed = (isPostProcess && source.data.postprocess.output === false)
            file_path = isPostProcess ? `${source.data.postprocess.path}.html` : file_path
            file_path = isPostSuppressed ? "" : file_path
        }

        // export non-markdown-based files
        else {
            // processing parts
            let req_parts, folder, file, file_ext, process_path, process_path_parts = "";
            
            // break up the file path into the parts that we need
            req_parts = utils.interpolateName(
                this,
                "[folder]!![path]!![name]!![ext]",
                context
            );
            
            req_parts = req_parts.split('!!');
            [folder, process_path, file, file_ext] = req_parts;
            
            process_path_parts = process_path.split("/");

            // check if the export path defines variables to be interpolated
            if (config.path && config.path.indexOf("[") > -1) {
                file_path = config.path;
            } 
            
            // remove all directories except for these
            if (config.emit) {
                // check for a parent/base folder
                let parts_check = config.emit.indexOf(process_path_parts[0]);
                
                // check for a full path
                let path_check = config.emit.indexOf(process_path);
                
                // check for full path plus name
                let deep_file_check = config.emit.indexOf(`${process_path}${file}`);
                let file_check = config.emit.indexOf(`${file}.${file_ext}`);
            
                if ( parts_check < 0 && path_check < 0 && deep_file_check < 0 && file_check < 0) {
                    file_path = "";
                } 
            }


            // remove certain folders from being exported out
            if (config.suppress) {
                                // check for a parent/base folder
                let parts_check = config.suppress.indexOf(process_path_parts[0]);
                
                // check for a full path
                let path_check = config.suppress.indexOf(process_path);
                
                // shallow file check
                let shallow_file_check = config.suppress.indexOf(`${file}.${file_ext}`);

                // check for full path plus name
                let deep_file_check = config.suppress.indexOf(`${process_path}${file}`);


                if ( parts_check >= 0 || path_check >= 0 || shallow_file_check >= 0 || deep_file_check >= 0) {
                    file_path = "";
                }
            }

            // lets make a certain page the homepage if we can
            file_path = (config.homepage && config.homepage == [process_path, file].join(""))
                ? 'index.html'
                : file_path

            // rename certain files to a different file_path
            const renamer = config.rename
            let renamePosition = 0

            file_path = (renamer)
                ? Object.keys(renamer).map( (key, index) => {
                    return (renamer[key].includes([process_path, file].join("")))
                        ? (renamePosition = index, key)
                        : file_path
                })[renamePosition]
                : file_path
        }

        // sub out all the placeholders
        var file = utils.interpolateName(
            this,
            file_path,
            context
        );

        // not needed with Markdown-based pages (mostly)
        // but if we have a specific template/component that needs to be expeosed
        // we'll often move it up some directory levels for ease of url structure.
        // ex: 
        //      /components/collections/blog.pug -> flatten -> /collections/blog/index.html
        // 
        // TODO: change how many levels it can be flattened
        // ex: 
        //      /components/collections/blog/blog.pug -> flatten(2) -> /collections/blog/index.html
        // 
        if (config.flatten_one_level) {
            var file_parts = file.split("/");
            if (file.indexOf(config.flatten_one_level) >= 0) {
                file_parts.shift();
                file = file_parts.join("/")
            }
        }

        // output the file and remove it from the stream as we don't need it anymore.
        if (file_path !== "") {
            this.emitFile(file, (source.content ? source.content : source));
        }
    }

    return "";
}
