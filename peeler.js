class HTMLFormatter
{
    #doc = null;
    #headers = [];
    #images = [];
    /* ------------------ *\
     *                    *
     *     Public API     *
     *                    *
    \* ------------------ */
    /**
     * Creates a new formatter given output from the peeler
     * @param {object} doc 
     */
    constructor(doc)
    {
        this.#doc=doc;
    }
    /**
     * Formats the document as HTML and inserts into target element
     * @param {HTMLElement} output Target Element
     * @param {number} skipfirst Amount of blocks to skip from the beginning
     * @param {number} skiplast Amount of blocks to skip from the end
     */
    outputHTMLDoc(output, skipfirst, skiplast)
    {
        let outdoc = this.#doc.slice(skipfirst,skiplast==0?undefined:-skiplast);
        this.#headers=[];
        this.#images=[];
        outdoc.forEach((block, i)=>{
            switch(block.type)
            {
                // h1..7
                case "header":
                    return this.outputHeader(block,i,output);
                // plain text block
                case "textblock":
                    return this.outputParagraph(block,i,output);
                // blockquote
                case "quote":
                    return this.outputBlockQuote(block,i,output);
                // code, gets put inside a blockquote
                case "codeblock":
                    return this.outputCodeBlock(block,i,output);
                // image, gets a description attached
                case "image":
                    return this.outputImage(block,i,output);
                // ordered or unordered list, items as blocks
                case "list":
                    return this.outputList(block,i,output);
            }
        });
    }
    /**
     * Returns a list of images, as tuples of [URL, HTML Element of the img tag]
     */
    get images()
    {
        return [...this.#images];
    }
    /**
     * Returns a list of header anchor names, as tuples of [header text, HTML Element]
     */
    get headers()
    {
        return [...this.#headers];
    }
    
    /* ------------------ *\
     *                    *
     *     HTML output    *
     *                    *
    \* ------------------ */
    outputHTMLElement(textElement, imgContainer)
    {
        // contains the text
        let textNode = document.createTextNode(textElement.text);
        // currently innermost node
        let currentNode = null;
        // the node containing the entire stack
        let topNode = null;
        // create a top-level <A> element if there's a link
        if(textElement.link)
        {
            currentNode = document.createElement("a");
            topNode = currentNode;
            currentNode.href = textElement.link;
        }
        if(textElement.image && imgContainer)
        {
            currentNode = document.createElement("div");
            topNode = currentNode;
            currentNode.className="inlineImg";
            let img = document.createElement("img");
            img.src=textElement.image;
            this.#images.push([textElement.image,img]);
            topNode.appendChild(img);
            topNode.appendChild(document.createElement("br"));
        }
        // create and nest any formatting tags like <EM> and <CODE>
        if(textElement.styles && textElement.styles.length>0)
        {
            textElement.styles.forEach((style)=>{
                let newNode = document.createElement(style);
                // if no top-level node exists yet, set it and the innermost
                if(!topNode)
                {
                    topNode = newNode;
                }
                // if innermost node exists, append to it and make the new node the innermost node
                if(currentNode)
                {
                    currentNode.appendChild(newNode);
                }
                currentNode=newNode;
            });
        }
        // if any nodes were created, append the text to innermost
        if(currentNode)
        {
            currentNode.appendChild(textNode);
        }
        // otherwise emit the text node
        else
        {
            topNode = textNode;
        }
        return topNode;
    }
    outputHTMLText(block,target)
    {
        if(!block)
        {
            return;
        }
        let elements = block.elements;
        if(!elements)
        {
            elements = block;
        }
        if(elements.length<1)
        {
            return;
        }
        let lastElement=target;
        let currentImg=null;
        elements.forEach((e)=>{
            let img = e.image??null;
            if(currentImg!=img)
            {
                if(img==null)
                {
                    lastElement= this.outputHTMLElement(e,false);
                    target.append(lastElement);
                    lastElement=target;
                }
                else
                {
                    lastElement = this.outputHTMLElement(e,true);
                    target.append(lastElement);
                }
            }
            else
            {
                lastElement.append(this.outputHTMLElement(e,false));
            }
            currentImg=img;
        });
    }
    outputHeader(block,i,outputElement)
    {
        let e =document.createElement("h"+block.level);
        this.outputHTMLText(block,e);
        // e.innerText=block.content;
        e.dataset.num=i;
        e.id="header"+this.#headers.length;
        this.#headers.push([e.textContent,e]);
        outputElement.appendChild(e);
    }
    outputParagraph(block, i, outputElement)
    {
        let e = document.createElement("p");
        this.outputHTMLText(block,e);
        e.dataset.num=i;
        outputElement.appendChild(e);
    }
    outputBlockQuote(block, i, outputElement)
    {
        let e = document.createElement("blockquote");
        this.outputHTMLText(block,e);
        e.dataset.num=i;
        outputElement.appendChild(e);
    }
    outputCodeBlock(block, i, outputElement)
    {
        let pre = document.createElement("pre");
        let e = document.createElement("code");
        this.outputHTMLText(block,e);
        e.dataset.num=i;
        let bq = document.createElement("blockquote");
        bq.dataset.num=i;
        bq.appendChild(pre);
        pre.appendChild(e);
        outputElement.appendChild(bq);
    }
    outputImage(block, i, outputElement)
    {                    
        let img = document.createElement("img");
        img.src = block.src;
        let e = document.createElement("p");
        e.classList.add("description");
        e.dataset.num=i;
        this.#images.push([block.src,img]);
        e.appendChild(img);
        // if it has a description, write it out
        if(block.description && block.description.length>1)
        {
            e.appendChild(document.createElement("br"));
            e.appendChild(document.createTextNode(block.description));
        }
        outputElement.appendChild(e);
    }
    outputList(block, i, outputElement)
    {
        switch(block.listType)
        {
            case "definition":
            {      
                this.outputDefinitionList(block, i, outputElement);
                break;
            }
            case "ordered":
            {      
                this.outputOrderedList(block, i, outputElement);
                break;
            }
            case "unordered":
            {      
                this.outputUnorderedList(block, i, outputElement);
                break;
            }     
        }
    }
    outputOrderedList(block, i, outputElement)
    {
        let e = document.createElement("ol");
        e.dataset.num=i;
        block.items.forEach((li)=>{
            let eli = document.createElement("li");
            this.outputHTMLText(li,eli);
            e.appendChild(eli);
        });
        outputElement.appendChild(e);
    }

    outputUnorderedList(block, i, outputElement)
    {
        let e = document.createElement("ul");
        e.dataset.num=i;
        block.items.forEach((li)=>{
            let eli = document.createElement("li");
            this.outputHTMLText(li,eli);
            e.appendChild(eli);
        });
        outputElement.appendChild(e);
    }
    outputDefinitionList(block, i, outputElement)
    {
        let e = document.createElement("dl");
        e.dataset.num=i;
        block.items.forEach((li)=>{
            let dt = document.createElement("dt");
            this.outputHTMLText(li.term,dt);
            e.appendChild(dt);
            let dd = document.createElement("dd");
            this.outputHTMLText(li.definition,dd);
            e.appendChild(dd);
        });
        outputElement.appendChild(e);
    }
}


class HTMLPeeler
{
    #container = null;
    #doc = [];
    #workingset = null;
    #headers = [];
    #images = [];
    #depth = 0;
    
    /* ------------------ *\
     *                    *
     *     Public API     *
     *                    *
    \* ------------------ */
    constructor(container)
    {
        this.#container=container;
    }
    /**
     * This sets the tag depths at which the peeler works - higher values flatten the tree more.
     */
    set depth(value)
    {
        console.log(value);
        this.#depth=value;
        this.#workingset = HTMLPeeler.flatten(this.#container.childNodes,this.#depth);
    }
    get depth()
    {
        return this.#depth;
    }
    /**
     * A key-value object with counts of every top-level tag encountered (Text nodes are shown as "#text")
     */
    get tagList()
    {
        let tags = {};
        this.#workingset.forEach(element => {
            if(!tags[element.nodeName])
            {
                tags[element.nodeName]=1;
            }
            else
            {
                tags[element.nodeName]++;
            }
        });
        return tags;
    }
    /**
     * Retrieves an array containing all extracted blocks.
     */
    get blocks()
    {
        return [...this.#doc];
    }
    scrape()
    {
        if(!this.#container)
        {
            return null;
        }
        this.#doc = [];
        // contents = e.querySelectorAll("p, h1, h2, h3, h4, h5, h6,  header, blockquote, ul, ol, dl, table");
        // run over every child element and extract blocks
        this.#workingset.forEach((node,i)=>{
            console.warn("processing #"+i+"<"+node.nodeName+">");
            console.log(node.innerHTML);
            let comp = this.extractBlocks(node,i,0);
            if(comp)
            {
                this.#doc.push(...comp);
            }
        });
        console.error("Done processing elements, formatting the data...");
        console.log(this.#doc);
        return this.#doc;
    }
    
    /* ------------------ *\
     *                    *
     *      Utility       *
     *     functions      *
     *                    *
    \* ------------------ */
    static makeTextElement(text, styles, link, image)
    {
        return {text: text, styles: styles, link:link, image: image};
    }
        
    static cmpfmt(a,b)
    {
        if(a==b)
        {
            return true;
        }
        if(a.length!=b.length)
        {
            return false;
        }
        let as=[...a].sort();
        let bs=[...b].sort();
        for(let i=0;i<a.length;i++)
        {
            if(a[i]!=b[i])
            {
                return false;
            }
        }
        return true;
    }
    static tryMergeNodes(a,b)
    {
        //console.warn("Trying to merge ",a ,b);
        if(!a || !b)
        {
            return false;
        }
        if(a.link!=b.link)
        {
            return false;
        }
        if(!HTMLPeeler.cmpfmt(a.styles,b.styles))
        {
            return false;
        }
        if(a.image!=b.image)
        {
            return false;
        }
        a.text += b.text;
        return true;

    }
    /**
     * Flattens a given node tree up to a certain depth, does not modify original object.
     * @param {Node[] | NodeList} nodes An Array of nodes or a NodeList to be flattened.
     * @param {number} depth Depth of nodes to flatten to.
     * @returns Node[] An Array of nodes after flattening
     */
    static flatten(nodes,depth)
    {
        console.log(nodes, depth);
        if(depth == 0)
            return Array.from(nodes);
        let result = [];
        nodes.forEach((node)=>{
            result.push(...HTMLPeeler.flatten(node.childNodes,depth-1));
            console.log(result);
            });
        return result;
    }

    static simplify(block)
    {
        console.log("simplfying " + block);
        let content = null;
        let newcontent = [];
        
        if(block.elements && block.elements.length>0)
        {
            /*
            if(typeof block.content == "string")
            {
                // #TODO: normalise to a text node
                return;
            }
            //*/
            content = block.elements;
        }
        else if(block.description && block.description.length>0)
        {
            return;
            content = block.description;
        }
        else if(block.items)
        {
            block.items.forEach((li)=>{
                this.simplify(li);
            });
            return;
        }
        if(block.definition || block.term)
        {
            simplify(block.definition);
            simplify(block.term);
        }
        if(!content || content.length<=1)
        {
            return;
        }
        let current = null;
        while(content.length>0)
        {
            let next = content.shift();
            if(HTMLPeeler.tryMergeNodes(current,next))
            {

            }
            else
            {
                newcontent.push(next);
                current = next;
            }
        }
        block.elements=newcontent;
    }
    
    /* ------------------ *\
     *                    *
     *     Extraction     *
     *                    *
    \* ------------------ */
    // expects an OL or UL element
    getRegularList(element)
    {
        let result=[];
        if(!element.hasChildNodes())
        {
            return [];
        }
        element.childNodes.forEach((node)=>{
            if(node.tagName!="LI")
            {
                return;
            }    
            let item=[];
            this.extractTextContent(item,node,[],"");
            result.push(item);
        });
        return result;
    }

    // expects a DL
    getDefinitionList(element)
    {
        let result = [];
        if(!element.hasChildNodes())
        {
            return [];
        }

        element.childNodes.forEach((node)=>{
            if(node.tagName=="DT")
            {
                let li = {term:[],definition:[]}; 
                this.extractTextContent(li.term,node,[],"");
            }
            if(node.tagName=="DD" && result.length>0)
            {
                this.extractTextContent(result[result.length-1].definition,node,[],"");
            }
        });
        return result;
    }
    extractTextContent(container,element, styles, link,image)
    {
        let currentLink = link;
        let currentStyles = [...styles];
        let currentImage = image;
        let fmap = {
            "DEL": "s",
            "U":"u",
            "S":"s",
            "B":"b",
            "STRONG":"b",
            "EM":"i",
            "I":"i",
            "PRE":"pre",
            "CODE":"code"
        };
        let TN = element.nodeName;
        if(TN=="IMG")
        {
            container.push(HTMLPeeler.makeTextElement("",[],"",element.src));
            return;
        }
        let nt = element.nodeType;
        if(container.length>0&&container[container.length-1].image)
        {
            let img = container[container.length-1];
            if(TN!="IMG")
            {
                currentImage=img.image;
            }
        }
        if(nt == Node.TEXT_NODE)
        {
            container.push(HTMLPeeler.makeTextElement(element.data,[...styles],currentLink,currentImage));
            return;
        }
        else
        {
            console.log("TAG IN P:"+TN);
        }
        if(!element.hasChildNodes)
        {
            return;
        }
        if(TN=="A")
        {
            currentLink = element.href;
        }
        if(fmap[TN])
        {
            currentStyles.push(fmap[TN]);
        }
        element.childNodes.forEach((node)=>{
            this.extractTextContent(container,node,currentStyles,currentLink,currentImage);
        });
        console.log(TN,element,container);
    }
    extractBlocks(e,i, level=0)
    {
        if(level>0)
        {
            // console.log("level "+level);
        }
        let levelref = "#"+i+"/"+level;
        let TN = e.nodeName;
        let nt = e.nodeType;
        console.warn(levelref+"<"+TN+">");
        let comp = {"type": "unknown", "content":[],elements:[]};
        // do a text block
        if(nt != Node.ELEMENT_NODE)
        {
            console.info("This was a text node.");
            console.log(e);
            console.info("---------------------");
            if(level > -1 && e.textContent.trim()!="")
            {
                comp.type="textblock";
                this.extractTextContent(comp.elements,e,[],"");
                console.info("text node @"+levelref+" added.");
            }
            else
            {
                console.info("text node @"+levelref+" skipped");
                return null;
            }
        }
        if(TN=="TABLE")
        {
            if(e.rows.length==1 && e.rows[0].childNodes.length==1)
            {
                console.log("singular table");
                let td=e.rows[0].childNodes[0];
                this.extractTextContent(comp.elements,td,[],"");
                let results = [];
                td.childNodes.forEach((n)=>{
                    let el = this.extractBlocks(n,i,level+1);
                    if(el && el.length>0)
                    {
                        results.push(...el);
                    }
                });
                return results;
                //return getEl(,i);

            }
        }
        // image
        if(TN =="IMG")
        {
            comp.type="image";
            comp.src =e.src;
            // try to get a description
            if(e.alt!="")
            {
                comp.description = e.alt;
            }
            if(e.title!="")
            {
                comp.description = e.title;
            }
        }
        // might not appear but try to detect embeds
        if(TN == "IFRAME")
        {
            comp.type="embed";
            comp.src = e.src;
            // getVideoTypeInfo(e.src,comp);
        }
        // do lists
        if(TN =="OL")
        {
            comp.type="list";
            comp.items = this.getRegularList(e);
            comp.listType="ordered";
        }
        if(TN =="UL")
        {
            comp.type="list";
            comp.items = this.getRegularList(e);
            comp.listType="unordered";
        }
        if(TN=="DL")
        {
            comp.type="list";
            comp.items = this.getDefinitionList(e);
            comp.listType ="definition";
        }
        // skip navs
        if(TN=="NAV")
        {
            return null;
        }
        // paragraphs, usually just contain text
        if(TN =="P")
        {
            comp.type="textblock";
            this.extractTextContent(comp.elements,e,[],"");
            // the check for textblock exists because
            // it may turn into an image block
            if(comp.elements.length<1 && comp.type=="textblock")
            {
                console.error("Empty element "+levelref);
                return null;
            }
        }
        // same for blockquotes
        if(TN=="BLOCKQUOTE")
        {
            comp.type="quote";
            this.extractTextContent(comp.elements,e,[],"");
        }
        // h1..7
        if(TN[0]=="H" && TN.length==2)
        {
            comp.type="header";
            comp.level=Number.parseInt(TN[1]);
            this.extractTextContent(comp.elements,e,[],"");
            return [comp];
        }
        let results = [comp];
        // some other tag, check if it is not empty
        if(e.hasChildNodes() && comp.type=="unknown")
        {
            if(e.children.length==1)
            {
                console.log("single node contains something");
                return this.extractBlocks(e.children[0],i,0);
            }
            console.error("AAAAAAAAAAAAAAAFUCK");
            this.extractTextContent(comp.elements,e,[],"");
            console.warn(comp.elements);
            if(comp.elements.length>0)
            {
                comp.type="textblock";
                HTMLPeeler.simplify(comp);
                return [comp];
            }
            results=[];
            let contents = e.childNodes;
            let newlvl = level+1;
            // try to extract blocks out of this level
            console.warn("Compound element @#"+i+", recursing "+level+">"+newlvl);
            console.log(e);
            console.info("-----------------------------------");
            // any of these might contain blocks
            if(TN=="TD" || TN=="DIV" || TN=="SECTION" || TN=="HEADER" || TN=="FIGURE" || TN=="ARTICLE")
            {
                contents.forEach((node)=>{
                    console.error("fuckfuckfuckfuckfuck");
                    let newcomp = this.extractBlocks(node,i, newlvl);
                    // if no blocks were found, return empty
                    if(newcomp && newcomp.length!=0)
                    {
                        console.log(newcomp);
                        console.info("Got the above from compound element "+levelref);
                        results.push(...newcomp);
                    }
                    else
                    {
                        console.error("Got nothing from compound element "+levelref);
                        return null;
                    }
                });
            }
            else
            {
                // try to extract something out of the tag anyway
                // possibly an image or some blocks
                console.error("unknown, not div");
                
                // fillEl(e,comp);
                results = [comp];
            }
            
        }
        else
        {
            
        }
        // only here if all extractions failed
        if(results.length==1 && results[0].type=="unknown")
        {
            console.error("Unknown @#:"+i+"/"+level);
            console.log(e);
            console.error("--------");
        }
        results.forEach((block)=>{
            //console.error("AAAAAAAAAAAAAAAAAAAA");
            //console.error(block);
            HTMLPeeler.simplify(block);
        });
        console.log(results);
        console.info("Got the above from element "+levelref);
        return results;
    }

}


function getVideoTypeInfo(url, target)
{
    try
    {
        let u = new URL(url);
        let host = u.hostname;
        let path = u.pathname;
        target.host = host;
    }
    catch(err)
    {
        console.err("<"+url+"> is a bad URL!!!");
    }
}


// attempt to extract an element into a container
function fillEl(e, container)
{
    return;
    console.warn("Filling container from element:");
    console.info(container,e);
    let TN = e.nodeName;
    let nt = e.nodeType;
    // convert block to image if given element is an image
    if(TN =="IMG")
    {
        console.log("Converted to image.");
        container.type="image";
        container.src =e.src;
        if(e.alt!="")
        {
            container.description=e.alt;
        }
        if(e.title!="")
        {
            container.description=e.title;
        }
        return;
    }
    // conver to embed if hitting an iframe
    if(TN == "IFRAME")
    {
        console.log("converted to embed");
        comp.type="embed";
        comp.src = e.src;
        getVideoTypeInfo(e.src,comp);
    }
    // if current container already has a type,
    // call appropriate extraction
    switch(container.type)
    {
        case "image":
        {
            // probably should do something else as this has no effect
            console.log("processing additional stuff in image");
            doP(e,container);
            return;
        }
        // standard extraction of formatted text
        case "textblock":
        case "quote":
        case "codeblock":
        {
            console.log("doing regular text block");
            doP(e,container);
            return;
        }
        // extract list elements
        case "list":
        {
            console.log("list time");
            doList(e,container);
            return;
        }
    }
    // turn into a codeblock if this tag found
    // and the container is not yet typed
    if(TN == "CODE")
    {
        console.log("making a codeblock");
        container.type="codeblock";
        container.content = [];
    }
    // nothing yet, recurse through children
    
    if(e.hasChildNodes())
    {
        console.info("Element still needs filling");
        let contents = e.childNodes;
            contents.forEach((node)=>{
            fillEl(node,container);
        });
        // if nothing set the container type yet
        // last ditch to extract some text
        if(container.type=="unknown")
        {
            console.warn("falling back to textblock!");
            console.log(e.innerHTML);
            console.log("----------------------------");
            container.type="textblock";
            e.childNodes.forEach((node)=>{
                fillEl(e,container);
            });
        }
    }
}