/**
 * Web App.
 *
 * Represents a web app and its metadata.
 */
class WebApp {

    /**
     * Constructor.
     * 
     * @param {Object} rawManifest Raw JSON of manifest fetched from the server.
     * @param {String} manifestUrl URL manifest was fetched from.
     * @param {String} documentUrl URL of the document manifest was linked from.
     */
    constructor(rawManifest, manifestUrl, documentUrl) {
      this.manifest = rawManifest;
  
      // Parse manifest to dictionary
      this.dictionary = {};
      this.parseFromManifest(rawManifest, manifestUrl, documentUrl);
    }
  
    /**
     * Parse a web app manifest.
     *
     * Follows the algorithm defined in
     * https://www.w3.org/TR/appmanifest/#processing
     *
     * @param {Object} rawManifest Raw JSON of manifest fetched from the server.
     * @param {String} manifestUrl URL manifest was fetched from.
     * @param {String} documentUrl URL of the document manifest was linked from.
     */
    parseFromManifest(rawManifest, manifestUrl, documentUrl) {
  
      // "If Type(json) is not Object"
      if(typeof(rawManifest) !== 'object' || rawManifest == null) {
          // "Issue a developer warning that the manifest needs to be an object."
          console.warn('Web app manifest should be an object.');
          // "Set json to be the result of parsing the string "{}"."
          rawManifest = JSON.parse('{}');
      }
  
      // "Let manifest be the result of converting json to a
      // WebAppManifest dictionary."
      var manifest = {};
  
      // "Process a text member passing json, manifest, and "name". "
      manifest.name = this.processTextMember(rawManifest.name);

      // "Process a text member passing json, manifest, and "short_name". "
      manifest.short_name = this.processTextMember(rawManifest.short_name);

      // "Set manifest["start_url"] to the result of running processing the
      // start_url member given manifest["start_url"], manifest URL, and
      // document URL."
      manifest.start_url = this.processStartUrlMember(rawManifest.start_url,
        manifestUrl, documentUrl);

      // Process the id member passing json and manifest. 
      manifest.id = this.processIdMember(rawManifest.id, manifest.start_url);

      // Process the scope member passing json, manifest and manifest URL
      manifest.scope = this.processScopeMember(rawManifest.scope, manifest.start_url, manifestUrl);

      manifest.icons = this.processImageResources(rawManifest.icons, manifestUrl);
  
      // Note: Currently no processing steps due to bug in specification
      // https://github.com/w3c/manifest/issues/760
      manifest.theme_color = rawManifest.theme_color;
  
      manifest.display = this.processDisplayMember(rawManifest.display);
  
      this.dictionary = manifest;
    }

    /**
     * Process navigation scope.
     * 
     * Follows the algorithm deined in 
     * https://www.w3.org/TR/appmanifest/#scope-member
     * 
     * @param {String} value The scope value provided in the raw manifest.
     * @param {String} startUrl The parsed start URL.
     * @param {String} manifestUrl The URl from which the manifest was retrieved.
     * @returns {String} The parsed navigation scope.
     * 
     */
    processScopeMember(value, startUrl, manifestUrl) {
      // 'Set manifest["scope"] to the result of parsing "." with manifest["start_url"] as the base URL.'
      let scope = new URL('.', startUrl).href;
      // 'If json["scope"] is the empty string, then return.'
      if (value === undefined || value === '') {
        return scope;
      }
      // 'Let scope be the result of parsing json["scope"] with manifest URL as the base URL.'
      let potentialScope;
      try {
        potentialScope = new URL(value, manifestUrl);
      // 'If scope is failure, return.'
      } catch {
        return scope;
      }
      // 'Set scope's query and fragment to null.'
      potentialScope.search = '';
      potentialScope.hash = '';
      // 'If manifest["start_url"] is not within scope of scope, return.'
      if (!this.isWithinScope(startUrl, potentialScope.href)) {
        return scope;
      // 'Otherwise, set manifest["scope"] to scope.'
      } else {
        return potentialScope.href;
      }
    }

    /**
     * Process a text member.
     * 
     * Follows the algorithm defined in 
     * https://w3c.github.io/manifest/#processing-text-members
     * 
     * @param {string} value The raw value provided.
     * @return {string} The processed value.
     */
    processTextMember(value) {
      // "If json[member] doesn't exists or json[member] is not a string, return."
      if (!value || typeof value != 'string') {
        return;
      }
      // "Strip leading and trailing ASCII whitespace from json[member]."
      // "Set map[member] to the value of json[member]."
      return value.trim();
    }
  
    /**
     * Process start URL.
     *
     * Follows the algorithm defined in
     * https://www.w3.org/TR/appmanifest/#start_url-member
     *
     * @param {String} value The raw value provided for start_url.
     * @param {String} manifestUrl URL from which the manifest was fetched.
     * @param {String} documentUrl URL of document from which manifest was linked.
     * @return {String} processed start URL.
     */
    processStartUrlMember(value, manifestUrl, documentUrl) {
      // "If value is the empty string, return document URL."
      if (!value || value == '') {
        return documentUrl;
      }
  
      // "Let start URL be the result of parsing value, using manifest URL as
      // the base URL."
      try {
        var startUrl = new URL(value, manifestUrl);
      } catch(e) {
        // "If start URL is failure:"
        // "Issue a developer warning."
        console.warn('Failed to resolve start URL of manifest, using ' +
          'manifest URL ' + value);
        // "Return document URL."
        return documentUrl;
      }
  
      // "If start URL is not same origin as document URL:"
      if (startUrl.origin != new URL(documentUrl).origin) {
        // "Issue a developer warning that the start_url needs to be same-origin
        // as the Document of the top-level browsing context."
        console.warn('Start URL of manifest needs to be same origin as document');
        // "Return document URL."
        return documentUrl;
      } else {
        // "Otherwise, return start URL."
        return startUrl.href;
      }
    }

    /**
     * Process id member.
     * 
     * Follows the algorithm defined in 
     * https://www.w3.org/TR/appmanifest/#id-member
     * 
     * @param {String} value The value of the id member of the manifest.
     * @param {String} starttUrl The processed start URL from the manifest.
     * @returns {String} The processed id.
     */
    processIdMember(value, startUrl) {
      // Set manifest["id"] to manifest["start_url"]. 
      let id = startUrl;

      // If the type of json["id"] is not string, return. 
      if (typeof value != 'string') {
        return id;
      }

      // If json["id"] is the empty string, return. 
      if (value === '') {
        return id;
      }

      // Let base origin be manifest["start_url"]'s origin. 
      const baseOrigin = new URL(startUrl).origin;

      // Let base origin be manifest["start_url"]'s origin. 
      let potentialId;
      try {
        potentialId = new URL(value, baseOrigin).href;
      } catch {
        // If id is failure, return. 
        return id;
      }

      // If id is not same origin as manifest["start_url"], return. 
      if(new URL(potentialId).origin != new URL(startUrl).origin) {
        return id;
      }

      // Set manifest["id"] to id. 
      id = potentialId;
      return id;
    }
  
    /**
    * Process an array of image resources (e.g. a list of icons).
    *
    * Follows the steps defined in:
    * https://www.w3.org/TR/appmanifest/#dfn-processing-imageresource-members
    *
    * @param {Array} imageResources The array of image resources to be processed.
    * @param {String} manifestUrl The URL from which the manifest was fetched.
    * @return {Array} An array of processed image resources.
    */
    processImageResources(rawImageResources, manifestUrl) {
      if (!rawImageResources) {
        return;
      }
      // 'Let imageResources be a new Array object created as if by the expression [].''
      var imageResources = [];
      // 'For each entry of manifest[member name]:'
      rawImageResources.forEach(function(imageResource) {
        // 'If entry["src"] is not undefined:'
        if (imageResource.src === undefined) {
          return;
        }
        // 'Let image be a new object created as if by the expression ({}).'
        var image = {};
        // 'Set image["src"] to the result of running processing the src member
        // 'of an image given entry and manifest URL.'
        image.src = this.processSrcMember(imageResource, manifestUrl);
        // 'Set image["type"] to the result of running processing the type member
        // of an image given entry and manifest URL.'
        image.type = this.processTypeMember(imageResource);
        // 'Set image["sizes"] to the result of running processing the sizes
        // member of an image given entry and manifest URL.'
        image.sizes = this.processSizesMember(imageResource);
        // 'Let purpose be the result of running processing the purpose member of
        // an image given entry and manifest URL.'
        // 'If purpose is failure, continue.'
        // 'Set image["purpose"] to purpose.'
        image.purpose = this.processPurposeMember(imageResource);
        // 'Append image to imageResources'
        imageResources.push(image);
      }, this);
      return imageResources;
    }
  
    /**
    * Process the src member of an ImageResource (e.g. the src of an icon).
    *
    * Follows the steps defined in:
    * https://www.w3.org/TR/appmanifest/#dfn-processing-the-src-member-of-an-image
    *
    * @param {Object} imageResource The ImageResource containing the src.
    * @param {String} manifestUrl The URL from which the manifest was fetched.
    * @return {URL} The parsed src URL.
    */
    processSrcMember(imageResource, manifestUrl) {
      // 'Let value be image["src"].'
      var value = imageResource.src;
      // 'If Type(value) it not String, return undefined.'
      if (!value || typeof(value) != 'string') {
        return undefined;
      }
      // 'Otherwise, parse value using manifest URL as the base URL and return
      // the result.'
      try {
        var parsedSrc = new URL(value, manifestUrl);
        return parsedSrc;
      } catch(e) {
        return undefined;
      }
    }
  
    /**
    * Process the type member of an ImageResource (e.g. the type of an icon).
    *
    * Follows the steps defined in:
    * https://www.w3.org/TR/appmanifest/#dfn-processing-the-type-member-of-an-image
    *
    * @param Object imageResource The ImageResource containing the type.
    * @return {String} The processed type of the ImageResource.
    */
    processTypeMember(imageResource) {
      // 'Let value be image["type"].'
      var value = imageResource.type;
      // 'If Type(value) it not String, return undefined.'
      if (!value || typeof(value) != 'string') {
        return undefined;
      }
      // 'If value is not a valid MIME type or the value of type is not a
      // supported media format, issue a developer warning and return undefined.'
      // (Not implemented yet)
      return value;
    }
  
    /**
    * Process the size member of an ImageResource (e.g. the sizes of an icon).
    *
    * Follows the steps defined in:
    * https://www.w3.org/TR/appmanifest/#dfn-processing-the-sizes-member-of-an-image
    *
    * @param {Object} imageResource The ImageResource containing the sizes member.
    * @return {Set} A set of available sizes as strings of the form "32x32"
    */
    processSizesMember(imageResource) {
      // 'Let set be an empty set.'
      var set = new Set();
      // 'Let value be image.sizes.'
      var value = imageResource.sizes;
      // 'If Type(value) it not String, return undefined.'
      if (!value || typeof(value) != 'string') {
        return undefined;
      }
      // 'Otherwise, parse value as if it was a [HTML] sizes attribute and let
      //  list keywords be the result.'
      var keywords = value.split(' ');
      // 'For each keyword of keywords:'
      keywords.forEach(function(keyword) {
        // 'Append keyword, lowercased, to set.''
        set.add(keyword.toLowerCase());
      });
      // 'Return set.'
      return set;
    }
  
    /**
    * Process the purpose member of an ImageResource (e.g. the purpose of an icon).
    *
    * Follows the steps defined in:
    * https://www.w3.org/TR/appmanifest/#dfn-processing-the-purpose-member-of-an-image
    *
    * @param {Object} imageResource The ImageResource containing the purpose member.
    * @return {Set} A set of strings describing purposes (undefined if failure)
    */
    processPurposeMember(imageResource) {
      // 'The icon purposes are as follows:'
      const ICON_PURPOSES = ['monochrome', 'maskable', 'any'];
      // 'If Type(image["purpose"]) it not String, or image["purpose"] consists
      // solely of ascii whitespace, then return the set « "any" ».'
      var purpose = imageResource.purpose;
      if (typeof(purpose) != 'string' || purpose.trim().length == 0) {
        return new Set(['any']);
      }
      // 'Let keywords be the result of split on ASCII whitespace
      // image["purpose"].'
      var keywords = purpose.split(' ');
      // 'If keywords is empty, then return the set « "any" ».'
      if (keywords.length == 0) {
        return new Set(['any']);
      }
      // 'Let purposes be the empty set.'
      var purposes = new Set();
      // 'For each keyword of keywords:'
      keywords.forEach(function(keyword) {
        var canonicalKeyword = keyword.toLowerCase();
        // 'If canonicalKeyword is not one of the icon purposes, or purposes
        // contains keyword, then issue a developer warning and continue.'
        if (!ICON_PURPOSES.includes(canonicalKeyword)) {
          console.warn('Invalid icon purpose');
          return;
        }
        if (purposes.has(canonicalKeyword)) {
          console.warn('Duplicate icon purpose');
          return;
        }
        purposes.add(canonicalKeyword);
      });
      // 'If purposes is empty, then return failure.'
      if (purposes.size == 0) {
        return undefined;
      } else {
        // 'Return purposes.'
        return purposes;
      }
    }
  
    /**
    * Process the display member.
    *
    * Check that display member is a valid display mode as per
    * https://www.w3.org/TR/appmanifest/#dom-displaymodetype
    *
    * @param {String} displayMode The display mode specified in the manifest.
    * @return {String} A valid display mode or undefined.
    */
    processDisplayMember(displayMode) {
      if (displayMode ===
        'fullscreen' ||
        'standalone' ||
        'minimal-ui' ||
        'browser') {
        return displayMode;
      } else {
        return undefined;
      }
    }

    /**
     * Determine whether a given URL is within scope of a given navigation scope.
     * 
     * Implements the algorithm defined in
     * https://w3c.github.io/manifest/#dfn-within-scope
     * 
     * @param {String} url The URL being tested. 
     * @param {String} [scope] The scope against which to test the URL. 
     * @returns {boolean|null} True for match, false for no match or null for missing scope.
     */
    isWithinScope(url, scope) {
      // If scope not provided as an argument, assume it has already been processed.
      if(!scope) {
        scope = this.dictionary.scope;
      }

      // If scope is still not set then return null.
      if(!scope) {
        return null;
      }

      let urlObject = new URL(url);
      let scopeObject = new URL(scope);

      // "If target and scope are not same origin, return false."
      if (urlObject.origin != scopeObject.origin) {
        return false;
      }

      // "Return a boolean indicating whether targetPath starts with scopePath."
      if(urlObject.pathname.startsWith(scopeObject.pathname)) {
        return true;
      } else {
        return false;
      }
    }
  
    /**
    * Get the shortest name of the app.
    *
    * @return {String} short_name or name of app.
    */
    getShortestName() {
      return this.dictionary.short_name || this.dictionary.name;
    }
  
    /**
    * Get the best available icon.
    *
    * Tries to find an icon equal to or larger than the requested size.
    *
    * @param {number} targetSize Preferred icon size in pixels.
    * @return {URL} URL of best available icon.
    */
    getBestIconUrl(targetSize) {
      if (!this.dictionary.icons || this.dictionary.icons.length == 0) {
        return undefined;
      }
  
      // Keep a track of the best icon and the best size found so far
      var bestIcon = null;
      var bestSize = Infinity;
  
      this.dictionary.icons.forEach(function(icon) {
  
        // filter out monochrome and maskable icons and those without a src
        if(!icon.src ||
          (!icon.purpose.has('any') && icon.purpose.has('monochrome')) ||
          (!icon.purpose.has('any') && icon.purpose.has('maskable'))) {
          return;
        }
  
        // If there's no best icon yet, this is the best icon so far
        if (!bestIcon) {
          bestIcon = icon;
        }
  
        // If the current icon supports any size, make it the new best icon.
        if (icon.sizes.has('any')) {
          bestIcon = icon;
          bestSize = 'any';
          return;
        }
  
        // If the best size is already 'any', stop processing this icon
        if (bestSize === 'any') {
          return;
        }
  
        // Convert Set of strings to Array of numbers (with special case 'any')
        var sizes = [];
        icon.sizes.forEach(function(sizeString) {
          // Parse number (e.g. 32) from size string (e.g. '32x32')
          // Note: Format of sizes attribute is specified in
          // https://html.spec.whatwg.org/multipage/semantics.html#the-link-element:dom-link-sizes
          var size = Number(sizeString.split('x')[0]);
          sizes.push(size);
        });
  
        // Look for a size which is better than the current bestSize
        sizes.forEach(function(size) {
          // If larger than but closer to target
          if (size >= targetSize && size <= bestSize) {
            bestSize = size;
            bestIcon = icon;
          // If larger than current best which is smaller than target
          } else if(bestSize < targetSize && size > bestSize) {
            bestSize = size;
            bestIcon = icon;
          // If smaller than but closer to target
          } else if(size <= targetSize &&
            (bestSize === Infinity || size >= bestSize)) {
            bestSize = size;
            bestIcon = icon;
          }
        });
      }, this);
  
      if(bestIcon) {
        return bestIcon.src;
      } else {
        return undefined;
      }
    }

    /**
     * Get navigation scope.
     * 
     * @return {String} Navigation scope URL.
     */
    get scope() {
      return this.dictionary.scope;
    }
  
    /**
     * Get start URL.
     *
     * @return {String} Start URL.
     */
    get startUrl() {
      return this.dictionary.start_url;
    }

    /**
     * Get ID.
     * 
     * @return {String} App ID.
     */
    get id() {
      return this.dictionary.id;
    }
  
    /**
     * Get name.
     *
     * @return {String} Name of web app.
     */
    get name() {
      return this.dictionary.name;
    }
  
    /**
     * Get short name.
     *
     * @return {String} Short name of web app.
     */
    get shortName() {
      return this.dictionary.short_name;
    }
  
    /**
     * Get display mode.
     *
     * @return {String} Display mode of app.
     */
    get display() {
      return this.dictionary.display;
    }
  
    /**
     * Get theme color.
     *
     * @return {String} RGB hex string.
     */
    get themeColor() {
      return this.dictionary.theme_color;
    }
  }
  