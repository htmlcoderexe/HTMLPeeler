class DocFormatter
{
    doc = null;
    /**
     * List of every image in the document.
     */
    images = [];
    /**
     * List of every header in the document.
     */
    headers = [];
    /**
     * A nested tree creating an outline of the document. Contains references to HTML
     * elements that were output the last time the formatter ran.
     */
    outline = [];
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
        this.doc = doc;
        // note these are copies and do not interact with the original document
        this.headers = this.doc.headers;
        this.images = this.doc.images;
        this.outline = this.doc.outline;
    }
    /**
     * Formats the document's blocks inserts into target object
     * @param {object} output Target Object
     */
    outputDoc(output)
    {
        this.doc.blocks.forEach((block, i)=>{
            if(block.isEmpty())
            {
                //console.log("Skipping empty block "+i);
                return;
            }
            switch(block.type)
            {
                // h1..7
                case "header":
                    return this.outputHeader(block, i, output);
                // plain text block
                case "textblock":
                    return this.outputParagraph(block, i, output);
                // blockquote
                case "quote":
                    return this.outputBlockQuote(block, i, output);
                // code, gets put inside a blockquote
                case "codeblock":
                    return this.outputCodeBlock(block, i, output);
                // image, gets a description attached
                case "image":
                    return this.outputImage(block, i, output);
                // ordered or unordered list, items as blocks
                case "list":
                    return this.outputList(block, i, output);
                // tables
                case "table":
                    return this.outputTable(block, i, output);
                // embeds (experimental)
                case "embed":
                    return this.outputEmbed(block, i, output);
            }
        });
    }
    outputParagraph(block, i, output)
    {
        
    }
    outputHeader(block, i, output)
    {
        
    }
    outputImage(block, i, output)
    {
        
    }
    outputList(block, i, output)
    {
        
    }
    outputTable(block, i, output)
    {
        
    }
    outputCodeBlock(block, i, output)
    {
        
    }
    outputBlockQuote(block, i, output)
    {
        
    }
    outputEmbed(block, i, output)
    {
        
    }
}

class MDFormatter
{
    outFormattedText(elements)
    {

    }

    outputParagraph(block, i, text)
    {

    }
}

class EditorJSFormatter extends DocFormatter
{
    elementsToText(elements)
    {
        if(!elements || elements.length<1)
        {
            return "";
        }
        let container = document.createElement("div");
        let lastElement=container;
        let currentImg=null;
        elements.forEach((e)=>{
            let img = e.image??null;
            if(img=="")
            {
                img=null;
            }
            if(currentImg!=img)
            {
                if(img==null)
                {
                    lastElement= this.outputElement(e,false);
                    container.append(lastElement);
                    lastElement=container;
                }
                else
                {
                    lastElement = this.outputElement(e,true);
                    container.append(lastElement);
                }
            }
            else
            {
                //console.log(lastElement,e,elements,target);
                lastElement.append(this.outputElement(e,false));
            }
            currentImg=img;
        });
        return container.innerHTML;
    }

    outputElement(element, imgContainer)
    {
// contains the text
        let textNode = document.createTextNode(element.text);
        // currently innermost node
        let currentNode = null;
        // the node containing the entire stack
        let topNode = null;
        if(element.special)
        {
            return document.createElement(element.special);
        }
        // create a top-level <A> element if there's a link
        if(element.link)
        {
            currentNode = document.createElement("a");
            topNode = currentNode;
            currentNode.href = element.link;
        }
        if(element.image && imgContainer)
        {
            currentNode = document.createElement("div");
            topNode = currentNode;
            currentNode.className="inlineImg";
            let img = document.createElement("img");
            img.src=element.image;
            this.images.push([element.image,img]);
            topNode.appendChild(img);
            topNode.appendChild(document.createElement("br"));
        }
        // create and nest any formatting tags like <EM> and <CODE>
        if(element.styles && element.styles.length>0)
        {
            element.styles.forEach((style)=>{
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

    outputParagraph(block, i, output)
    {
        let obj = {
            type:"paragraph",
            data:{
                text: ""
            }
        };
        obj.data.text= this.elementsToText(block.elements);
        obj.data.num = i;
        output.blocks.push(obj);
    }
    outputHeader(block, i, output)
    {
        let obj = {
            type:"header",
            data:{
                text: "",
                level: 0
            }
        };
        obj.data.text = this.elementsToText(block.elements);
        obj.data.level = block.level;
        obj.data.num = i;
        output.blocks.push(obj);
    }
    outputImage(block, i, output)
    {
        let obj = {
            type:"image",
            data:{
                caption: "",
                url: 0
            }
        };
        obj.data.caption = this.elementsToText(block.elements);
        obj.data.url = block.src;
        obj.data.num = i;
        output.blocks.push(obj);
    }
    outputList(block, i, output)
    {
        let obj = {
            type:"list",
            data:{
                style: "unordered",
                items: []
            }
        };
        obj.data.style = block.listType;
        obj.data.num = i;
        block.items.forEach((item)=>{
            let li = {
                content: "",
                meta: {},
                items: []
            };
            li.content = this.elementsToText(item);
            obj.data.items.push(li);
        });
        output.blocks.push(obj);
    }
    outputTable(block, i, output)
    {
        let obj = {
            type:"table",
            data:{
                withHeadings: true,
                content: []
            }
        };
        obj.data.style = block.listType;
        obj.data.num = i;
        block.rows.forEach((row)=>{
            let tr = [];
            row.forEach((col)=>{
                tr.push(this.elementsToText(col));
            });
            obj.data.content.push(tr);
        });
        output.blocks.push(obj);
        
    }
    outputCodeBlock(block, i, output)
    {
        let obj = {
            type:"code",
            data:{
                code: ""
            }
        };
        obj.data.code= this.elementsToText(block.elements);
        obj.data.num = i;
        output.blocks.push(obj);
        
    }
    outputBlockQuote(block, i, output)
    {
        let obj = {
            type:"quote",
            data:{
                text: ""
            }
        };
        obj.data.text= this.elementsToText(block.elements);
        obj.data.num = i;
        output.blocks.push(obj);
    }
    outputEmbed(block, i, output)
    {
        
    }

}

/**
 * Provides functions to output a StructuredDocument as HTML.
 */
class HTMLFormatter extends DocFormatter
{
    
    /**
     * Outputs a nested TOC based on the document's outline.
     * @param {HTMLElement} output the element to output the outline into.
     */
    outputTOC(output)
    {
        HTMLFormatter.outputTOCBranch(output, this.outline)
    }
    /* ------------------ *\
     *                    *
     *     HTML output    *
     *                    *
    \* ------------------ */
    /**
     * Outputs recursively ordered lists into the given eleement.
     * @param {HTMLElement} output the element to output the resulting subtree to. 
     * @param {Object[]} branch a branch of an outline tree containing headings
     * with possible subheadings. 
     */
    static outputTOCBranch(output, branch)
    {
        branch.forEach((item)=>{
            if(!item.element)
            {
                console.log(item);
                return;
            }
            let li = output.ownerDocument.createElement("li");
            let a = output.ownerDocument.createElement("a");
            li.appendChild(a);
            a.href = "#" + item.element.id;
            a.innerText = item.text;
            output.appendChild(li);
            if(item.subheadings && item.subheadings.length>0)
            {
                let ol = output.ownerDocument.createElement("ol");
                li.appendChild(ol);
                HTMLFormatter.outputTOCBranch(ol, item.subheadings);
            }
        });
    }
    /**
     * Outputs a single block element as HTML
     * @param {*} textElement 
     * @param {*} imgContainer 
     * @returns 
     */
    outputHTMLElement(textElement, imgContainer)
    {
        // contains the text
        let textNode = output.ownerDocument.createTextNode(textElement.text);
        // currently innermost node
        let currentNode = null;
        // the node containing the entire stack
        let topNode = null;
        if(textElement.special)
        {
            return output.ownerDocument.createElement(textElement.special);
        }
        // create a top-level <A> element if there's a link
        if(textElement.link)
        {
            currentNode = output.ownerDocument.createElement("a");
            topNode = currentNode;
            currentNode.href = textElement.link;
        }
        if(textElement.image && imgContainer)
        {
            currentNode = output.ownerDocument.createElement("div");
            topNode = currentNode;
            currentNode.className="inlineImg";
            let img = output.ownerDocument.createElement("img");
            img.src=textElement.image;
            this.images.push([textElement.image,img]);
            topNode.appendChild(img);
            topNode.appendChild(output.ownerDocument.createElement("br"));
        }
        // create and nest any formatting tags like <EM> and <CODE>
        if(textElement.styles && textElement.styles.length>0)
        {
            textElement.styles.forEach((style)=>{
                let newNode = output.ownerDocument.createElement(style);
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
            if(block.forEach)
            {
                elements = block;
            }
            else
            {
                return;
            }
            // elements = block;
        }
        if(elements.length<1)
        {
            return;
        }
        let lastElement=target;
        let currentImg=null;
        elements.forEach((e)=>{
            let img = e.image??null;
            if(img=="")
            {
                img=null;
            }
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
                //console.log(lastElement,e,elements,target);
                lastElement.append(this.outputHTMLElement(e,false));
            }
            currentImg=img;
        });
    }
    outputHeader(block,i,outputElement)
    {
        let e =output.ownerDocument.createElement("h"+block.level);
        this.outputHTMLText(block,e);
        // e.innerText=block.content;
        e.dataset.num=i;
        let ho = StructuredDocument.findOutlineHeaderByIndex(this.outline,i);
        if(ho)
        {
            ho.element = e;
        }
        e.id="header"+i;
        outputElement.appendChild(e);
    }
    outputParagraph(block, i, outputElement)
    {
        let e = output.ownerDocument.createElement("p");
        this.outputHTMLText(block,e);
        e.dataset.num=i;
        outputElement.appendChild(e);
    }
    outputBlockQuote(block, i, outputElement)
    {
        let e = output.ownerDocument.createElement("blockquote");
        this.outputHTMLText(block,e);
        e.dataset.num=i;
        outputElement.appendChild(e);
    }
    outputCodeBlock(block, i, outputElement)
    {
        let pre = output.ownerDocument.createElement("pre");
        let e = output.ownerDocument.createElement("code");
        this.outputHTMLText(block,e);
        e.dataset.num=i;
        let bq = output.ownerDocument.createElement("blockquote");
        bq.dataset.num=i;
        bq.appendChild(pre);
        pre.appendChild(e);
        outputElement.appendChild(bq);
    }
    outputImage(block, i, outputElement)
    {                    
        let img = output.ownerDocument.createElement("img");
        img.src = block.src;
        let e = output.ownerDocument.createElement("p");
        e.classList.add("description");
        e.dataset.num=i;
        this.images.push([block.src,img]);
        e.appendChild(img);
        // if it has a description, write it out
        if(block.description && block.description.length>1)
        {
            e.appendChild(output.ownerDocument.createElement("br"));
            e.appendChild(output.ownerDocument.createTextNode(block.description));
        }
        if(block.elements && block.elements.length>1)
        {
            this.outputHTMLText(block,e);
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
        let e = output.ownerDocument.createElement("ol");
        e.dataset.num=i;
        block.items.forEach((li)=>{
            let eli = output.ownerDocument.createElement("li");
            this.outputHTMLText(li,eli);
            e.appendChild(eli);
        });
        outputElement.appendChild(e);
    }

    outputUnorderedList(block, i, outputElement)
    {
        let e = output.ownerDocument.createElement("ul");
        e.dataset.num=i;
        block.items.forEach((li)=>{
            let eli = output.ownerDocument.createElement("li");
            this.outputHTMLText(li,eli);
            e.appendChild(eli);
        });
        outputElement.appendChild(e);
    }
    outputDefinitionList(block, i, outputElement)
    {
        let e = output.ownerDocument.createElement("dl");
        e.dataset.num=i;
        block.items.forEach((li)=>{
            let dt = output.ownerDocument.createElement("dt");
            this.outputHTMLText(li.term,dt);
            e.appendChild(dt);
            let dd = output.ownerDocument.createElement("dd");
            this.outputHTMLText(li.definition,dd);
            e.appendChild(dd);
        });
        outputElement.appendChild(e);
    }
    outputTable(block, i, outputElement)
    {
        let t = output.ownerDocument.createElement("table");
        t.dataset.num = i;
        block.rows.forEach((row,n)=>{
            let tr = output.ownerDocument.createElement("tr");
            row.forEach((cell)=>{
                let td = output.ownerDocument.createElement(n==0?"th":"td");
                this.outputHTMLText(cell,td);
                tr.appendChild(td);
            });
            t.appendChild(tr);
        });
        outputElement.appendChild(t);
    }
    outputEmbed(block,i,outputElement)
    {
        
        let e = output.ownerDocument.createElement("p");
        e.dataset.num=i;
        e.innerText=block.src;
        outputElement.appendChild(e);
    }
}


class DocumentBlock
{

    type = "unknown";

    elements = [];

    constructor(type="unknown")
    {
        this.type = type;
    }
    
    isEmpty()
    {
        return this.text=="" && this.images.length==0;
    }
    static continue(block)
    {
        switch(block.type)
        {
            // h1..7
            case "header":
                return new DocumentHeader(block.level);
            // plain text block
            case "textblock":
                return new DocumentParagraph();
            // blockquote
            case "quote":
                return new DocumentQuote();
            // code, gets put inside a blockquote
            case "codeblock":
                return new DocumentCode();
            // image, gets a description attached
            case "image":
                return new DocumentMedia("image",block.src);
            // ordered or unordered list, items as blocks
            case "list":
                return new DocumentList(block.listType);
            // tables
            case "table":
                return new DocumentTable();
            // embeds (experimental)
            case "embed":
                return new DocumentMedia("embed", block.src);
        }
        return new DocumentBlock();
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
    static tryMerge(a,b)
    {
        ////console.warn("Trying to merge ",a ,b);
        if(!a || !b)
        {
            return false;
        }
        if(a.link!=b.link)
        {
            return false;
        }
        if(!DocumentBlock.cmpfmt(a.styles,b.styles))
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
    static mergeElements(elements)
    {
        // console.log(elements);
        let input=[...elements];
        let output=[];
        let current = null;
        while(input.length>0)
        {
            let next = input.shift();
            if(DocumentBlock.tryMerge(current,next))
            {

            }
            else
            {
                output.push(next);
                current = next;
            }
        }
        return output;
    }
    postProcess()
    {
        let content = null;
        let newcontent = [];
        let block = this;
        // check if this block could be an image
        if(this.elements && this.elements.length>0)
        {
            let imagefound = "";
            let all_same = true;
            this.elements.forEach((e)=>{
                if(!e.image)
                {
                    e.image="";
                }
                if(e.image!=imagefound)
                {
                    if(imagefound=="")
                    {
                        imagefound = e.image;
                    }
                    else
                    {
                        all_same = false;
                    }
                }
                //console.log(all_same,imagefound,block);
            });
            if(all_same && imagefound!="")
            {
                this.elements.forEach((e)=>{
                    e.image="";
                });
                block = new DocumentMedia("image",imagefound,this.elements);
            }
            content = block.elements;
        }
        if(block.elements)
        {
            block.elements = DocumentBlock.mergeElements(block.elements);
        }
        return block;
        if(!content || content.length<=1)
        {
            return;
        }
        let current = null;
        newcontent=DocumentBlock.mergeElements(content);
        block.elements=newcontent;
        if(block.type=="unknown")
        {
            block.type="textblock";
        }
    }

    static getTextFromElements(elementList)
    {
        if(!elementList || elementList.length<0)
            return false;
        let accumulator = "";
        elementList.forEach((e)=>{
            if(e.text)
                accumulator+=e.text;
        });
        accumulator = accumulator.trim();
        return accumulator;
    } 

    get text()
    {
        if(!this.elements)
            return "";
        if(this.elements.length<1)
            return "";
        return DocumentBlock.getTextFromElements(this.elements);
    }

    get images()
    {
        if(!this.elements)
            return [];
        if(this.elements.length<1)
            return [];
        let imglist = [];
        this.elements.forEach((e)=>{
            if(e.image&&e.image!=""&&!imglist.find((img)=>img==e.image))
            {
                imglist.push(e.image);
            }
        });
        return imglist;
    }

}


class DocumentTable extends DocumentBlock
{

    rows = "";
    
    constructor(rows = [])
    {
        super("table");
        this.rows = rows?[...rows]:[];
    }

    isEmpty()
    {
        return (!this.rows || this.rows.length<1);
    }

}


class DocumentMedia extends DocumentBlock
{

    src = "";

    constructor(mediaType, src, elements = [])
    {
        switch(mediaType)
        {
            case "image":
            case "embed":
            case "video":
            case "audio":
                {super(mediaType);break;}

            default:
                super("unknown");
        }
        this.src = src;
        this.elements = elements?[...elements]:[];
    }

    isEmpty()
    {
        return false;
    }

    get images()
    {
        let result = super.images;
        if(this.type == "image")
        {
            result.push(this.src);
        }
        return result;
    }
}


class DocumentList extends DocumentBlock
{
    items = [];

    constructor(listType, items=[])
    {
        super("list");
        this.listType="unknown";
        switch(listType)
        {
            case "ordered":
            case "unordered":
            case "definition":
                this.listType = listType;
        }
        this.items = items?[...items]:[];
    }

    isEmpty()
    {
        if(this.items.length<1)
        {
            return true;
        }
        let accumulator = "";
        this.items.forEach((li)=>{
            accumulator+=DocumentBlock.getTextFromElements(li.elements);
        });
        if(accumulator=="")
            return true;
        return false;
    }
    postProcess()
    {
        // empty list returned as is;
        if(!this.items)
        {
            return this;
        }
        if(this.listType=="definition")
        {
            this.items.forEach((item)=>{
                item.term = DocumentBlock.mergeElements(item.term);
                item.definition = DocumentBlock.mergeElements(item.definition);
            });
        }
        else
        {
            for(let i=0;i<this.items.length;i++)
            {
                this.items[i] = DocumentBlock.mergeElements(this.items[i]);
            }
        }
        return this;
    }
}


class DocumentParagraph extends DocumentBlock
{

    constructor(elements = [])
    {
        super("textblock");
        this.elements = elements?[...elements]:[];
    }
}


class DocumentQuote extends DocumentBlock
{

    constructor(elements = [])
    {
        super("quote");
        this.elements = elements?[...elements]:[];
    }
}


class DocumentCode extends DocumentBlock
{

    constructor(elements = [])
    {
        super("codeblock");
        this.elements = elements?[...elements]:[];
    }
}


class DocumentHeader extends DocumentBlock
{

    level = 1;

    constructor(level = 1, elements = [])
    {
        super("header");
        this.level = level;
        this.elements = [];
    }
}


class StructuredDocument
{

    #blocks = [];
    
    title = "";
    #slice_start = 0;
    #slice_end = 0;
    constructor(blocks=[])
    {
        this.#blocks=[...blocks];
    }

    push(block)
    {
        this.#blocks.push(block);
    }

    postProcess()
    {
        for(let i=0;i<this.#blocks.length;i++)
        {
            // console.log(this.#blocks[i]);
            this.#blocks[i] = this.#blocks[i].postProcess();
        }
    }

    trim(start=0,end=0)
    {
        this.#slice_start = start;
        this.#slice_end = end;
    }

    get blocks()
    {
        return [...(this.#blocks.slice(this.#slice_start,this.#slice_end==0?undefined:-this.#slice_end))];
    }

    get headers()
    {
        let result = [];
        this.blocks.forEach((b,i)=>{
            if(b.type=="header")
            {
                //b.text="aaaa";
                result.push({level: b.level, text: b.text, index: i});
            }
        });
        return result;
    }

    get outline()
    {
        let flat = this.headers;
        
        let curlvl = 2;
        let lastli = null;
        let root = [];
        let depthstack = [root];
        for(let i=0;i<flat.length;i++)
        {
            let header = flat[i];
            if(header.level == 1)
            {
                continue;
            }
            let diff = curlvl - header.level;
            // bigger level, smaller heading, increase nesting
            if(diff<0)
            {
                for(let j=0;j<-diff;j++)
                {
                    let currentlist = depthstack.pop();
                    let li=lastli;
                    if(!lastli)
                    {
                        li = {level: 1, text:document.title, index:0, subheadings:[]};
                        currentlist.push(li);
                    }
                    let nextlvl = li.subheadings;
                    depthstack.push(currentlist);
                    depthstack.push(nextlvl);
                }
            }
            // smaller level, bigger heading, decrease nesting
            if(diff>0)
            {
                for(let j=0;j<diff;j++)
                {
                    depthstack.pop();
                }
            }
            curlvl = header.level;
            let curlist = depthstack.pop();
            let li={level: header.level, text: header.text, index: header.index, subheadings: []};
            curlist.push(li);
            lastli = li;
            depthstack.push(curlist);
        }
        return root;
    }

    static findOutlineHeaderByIndex(tree, index)
    {
        if(!tree || !tree.forEach)
        {
            return null;
        }
        for(let i=0;i<tree.length;i++)
        {
            if(tree[i].index == index)
            {
                return tree[i];
            }
            let result = StructuredDocument.findOutlineHeaderByIndex(tree[i].subheadings,index);
            if(result)
            {
                return result;
            }
        }
        return null;
    }

    get images()
    {
        let imglist = [];
        this.blocks.forEach((b)=>{
            let blockimages = b.images;
            if(blockimages && blockimages.length>0)
            {
                imglist.push([...blockimages]);
            }
        });
        return imglist;
    }
}


class HTMLPeeler
{
    #container = null;
    #doc = [];
    #workingset = null;
    #depth = -1;
    #currentblock = null;
    filters = {};
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
        // set the private field first
        this.#depth = value;
        // then reload working set
        // if -1 for autodetect, the below ignores initial #depth
        // once completed, #depth is equal to whatever was autodetected
        this.refreshWorkingSet(value);
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
        return [...this.#doc.blocks];
    }
    get headers()
    {
        let result = [];
        this.#doc.forEach((b)=>{
            if(b.type=="header")
                result.push(b.level);
        });
    }
    /**
     * Prepares the current working set of nodes to process into blocks
     * @param {int} value depth to search, -1 to autodetect and set depth
     * @returns 
     */
    refreshWorkingSet(value=null)
    {
        if(value==null)
        {
            value = this.#depth;
        }
        if(value==-1)
        {
            this.autodetect();
            return;
        }
        this.#workingset = HTMLPeeler.loadWorkingSet(this.#container,this.#depth,this.filters);
    }

    static loadWorkingSet(container,depth, filters)
    {
    console.log("with container",container,depth,filters);
        let node = container;
        let candidateArray = [];
        if(!node || !node.childNodes || node.childNodes.length < 1)
        {
            return [];
        }
        if(filters)
        {
            if(filters.articleSelector && filters.articleSelector!="")
            {
                node = container.querySelector(filters.articleSelector);
                candidateArray = node?.childNodes;
            }
            else if(filters.blockSelector && filters.blockSelector!="")
            {
                candidateArray = container.querySelectorAll(filters.blockSelector);
            }
        }
        if(!candidateArray || candidateArray.length < 1)
        {
            return [];
        }
        return HTMLPeeler.flatten(candidateArray,depth);
    }

    scrape(nocheck = false)
    {
        if(!this.#container)
        {
            return null;
        }
        if(!nocheck && (!this.#workingset || this.#workingset.length<1))
        {
            this.refreshWorkingSet();
        }
        this.#doc = new StructuredDocument();
        // contents = e.querySelectorAll("p, h1, h2, h3, h4, h5, h6,  header, blockquote, ul, ol, dl, table");
        // run over every child element and extract blocks
        let h1s = this.#container.querySelectorAll("h1");
        // console.log(h1s);
        if(h1s.length>0)
        {
            let t="";
            h1s.forEach((n)=>{
                if(n.innerText.length>t.length)
                    t=n.innerText;
            });
            this.#doc.title = t;
            
        }
        this.#workingset.forEach((node,i)=>{
            //console.warn("processing #"+i+"<"+node.nodeName+">");
            //console.log(node.innerHTML);
            //this.extractBlocks(node,i,0);
            //*
            let comp = this.extractBlocks(node,i,0);
            if(comp)
            {
                comp.forEach((block)=>{if(block.type=="unknown"){block.type="textblock"}});
                this.#doc.push(...comp);
            }
            //*/
        });
        this.#doc.postProcess();
        //console.error("Done processing elements, formatting the data...");
        //console.log(this.#doc);
        return this.#doc;
    }
    
    /* ------------------ *\
     *                    *
     *      Utility       *
     *     functions      *
     *                    *
    \* ------------------ */

    autodetect()
    {
        console.log("trying to autodetect...");
        let headersmax=0;
        let maxdepth=0;
        let filters = {};
        if(this.articleSelector!="")
        {
            filters.articleSelector = this.articleSelector;
        }
        
        for(let i=0;i<10;i++)
        {
            console.log("trying level "+i+"...");
            this.#workingset = HTMLPeeler.loadWorkingSet(this.#container,i,this.filters);
            this.scrape(true);
            let headers=0;
            this.#doc.blocks.forEach((b)=>{
                if(b.type=="header")
                    headers++;
            });
            if(headers>headersmax)
            {
                headersmax=headers;
                maxdepth=i;
                console.log("Best found so far: "+headersmax+" at level "+i+"...");
            }
        }
        this.#depth=maxdepth;
        this.#workingset = HTMLPeeler.loadWorkingSet(this.#container,this.#depth,this.filters);
        console.log("depth is now "+maxdepth+"");
    }

    static makeTextElement(text, styles, link, image)
    {
        return {text: text, styles: styles, link:link, image: image};
    }
        
    /**
     * Flattens a given node tree up to a certain depth, does not modify original object.
     * @param {Node[] | NodeList} nodes An Array of nodes or a NodeList to be flattened.
     * @param {number} depth Depth of nodes to flatten to.
     * @returns Node[] An Array of nodes after flattening
     */
    static flatten(nodes,depth)
    {
        //console.log(nodes, depth);
        if(depth == 0)
            return Array.from(nodes);
        let result = [];
        nodes.forEach((node)=>{
            result.push(...HTMLPeeler.flatten(node.childNodes,depth-1));
            //console.log(result);
            });
        return result;
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
                result.push(li);
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
            "DEL": "del",
            "U":"u",
            "S":"del",
            "B":"strong",
            "STRONG":"strong",
            "EM":"em",
            "I":"em",
            "PRE":"pre",
            "CODE":"code",
            "SUP":"sup",
            "SUB":"sub",
            "KBD":"kbd",
            "SMALL":"small"
        };
        let TN = element.nodeName;
        
        // h1..7
        if(TN[0]=="H" && TN.length==2 && this.#currentblock && this.#currentblock.type!="header")
        {
            //HTMLPeeler.simplify(this.#currentblock);
            console.log(this.#currentblock);
            this.#doc.push(this.#currentblock);
            let newblock =  DocumentBlock.continue(this.#currentblock);
            let comp = new DocumentHeader(Number.parseInt(TN[1]));
            element.childNodes.forEach((e)=>{
            this.extractTextContent(comp.elements,e,[],"");});
            this.#doc.push(comp);
            this.#currentblock = newblock;
            return;
        }
        if(TN=="IFRAME" && this.#currentblock)
        {
            // HTMLPeeler.simplify(this.#currentblock);
            this.#doc.push(this.#currentblock);
            let newblock =  DocumentBlock.continue(this.#currentblock);
            let comp = new DocumentMedia("embed",element.src);
            this.#doc.push(comp);
            this.#currentblock = newblock;
            return;
        }
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
        if(TN=="BR")
        {
            container.push({special:"br", image:currentImage});
        }
        if(TN=="HR")
        {
            container.push({special:"hr", image:currentImage});
        }
        if(nt == Node.TEXT_NODE)
        {
            container.push(HTMLPeeler.makeTextElement(element.data,[...styles],currentLink,currentImage));
            return;
        }
        else
        {
            //console.log("TAG IN P:"+TN);
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
        //console.error(TN,element,container);
    }
    extractBlocks(e,i, level=0)
    {
        if(level>0)
        {
            // //console.log("level "+level);
        }
        let levelref = "#"+i+"/"+level;
        let TN = e.nodeName;
        let nt = e.nodeType;
        //console.warn(levelref+"<"+TN+">");
        let comp = new DocumentBlock();
        // do a text block
        if(nt != Node.ELEMENT_NODE)
        {
            //console.info("This was a text node.");
            //console.log(e);
            //console.info("---------------------");
            if(level > -1 && e.textContent.trim()!="")
            {
                comp = new DocumentParagraph();
                this.extractTextContent(comp.elements,e,[],"");
                this.#doc.push(comp);
                //console.info("text node @"+levelref+" added.");
            }
            else
            {
                //console.info("text node @"+levelref+" skipped");
                return null;
            }
        }
        if(TN=="TABLE")
        {
            if(e.rows.length==1 && e.rows[0].childNodes.length==1)
            {
                //console.log("singular table");
                let td=e.rows[0].childNodes[0];
               
                let results = [];
                this.#currentblock=comp;
                td.childNodes.forEach((n)=>{
                    //console.log(n,this.#currentblock);
                    this.extractTextContent(this.#currentblock.elements,n,[],"");
                    
                    //let el = this.extractBlocks(n,i,level+1);
                    /*if(el && el.length>0)
                    {
                        results.push(...el);
                    }//*/
                });
                //this.#doc.push();
                //console.log(this.#currentblock);
                comp = this.#currentblock;
                this.#currentblock = null;
                //HTMLPeeler.simplify(comp);
                return [comp];
                //return getEl(,i);

            }
            else
            {
                //console.log("regular table");
                comp = new DocumentTable();
                //console.log(e.rows);
                Array.from(e.rows).forEach((tr)=>{
                    let row = [];
                    tr.childNodes.forEach((td)=>{
                        let cell = [];
                        this.extractTextContent(cell,td,[],"");
                        // cell=HTMLPeeler.runMerge(cell);
                        row.push(cell);
                    });
                    comp.rows.push(row);
                });
                return [comp];
            }
        }
        // image
        if(TN =="IMG")
        {
            comp = new DocumentMedia("image",e.src);
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
            comp = new DocumentMedia("embed",e.src);
            // getVideoTypeInfo(e.src,comp);
        }
        // do lists
        if(TN =="OL")
        {
            comp = new DocumentList("ordered",this.getRegularList(e));
        }
        if(TN =="UL")
        { 
            comp = new DocumentList("unordered",this.getRegularList(e));
        }
        if(TN=="DL")
        {
            comp = new DocumentList("definition",this.getDefinitionList(e));
        }
        // skip navs
        if(TN=="NAV")
        {
            return null;
        }
        // paragraphs, usually just contain text
        if(TN =="P")
        {
           comp=new DocumentParagraph();
            this.extractTextContent(comp.elements,e,[],"");
            // the check for textblock exists because
            // it may turn into an image block
            if(comp.elements.length<1 && comp.type=="textblock")
            {
                //console.error("Empty element "+levelref);
                return null;
            }
        }
        // same for blockquotes
        if(TN=="BLOCKQUOTE")
        {
            comp = new DocumentQuote();
            this.extractTextContent(comp.elements,e,[],"");
        }
        // same for pre->code
        if(TN=="PRE" && e.children && e.children[0] && e.children[0].nodeName=="CODE")
        {
            comp = new DocumentCode();
            let cc = e.children[0].childNodes;
            // okay the bug I was trying to fix apparently had to do with PRE being able to 
            // have a "tab-size" style while default seems more like 8
            // so the double wrapping in code/pre had little to do with this
            // but still nice to fix
            cc.forEach((node)=>{
                this.extractTextContent(comp.elements,node,[],"");
            });
        }
        // h1..7
        if(TN[0]=="H" && TN.length==2)
        {
            comp = new DocumentHeader(Number.parseInt(TN[1]));
            this.extractTextContent(comp.elements,e,[],"");
            return [comp];
        }
        let results = [comp];
        // some other tag, check if it is not empty
        if(e.hasChildNodes() && comp.type=="unknown")
        {
            if(e.children.length==1)
            {
                //console.log("single node contains something");
                return this.extractBlocks(e.children[0],i,0);
            }
            //console.error("AAAAAAAAAAAAAAAFUCK");
            this.extractTextContent(comp.elements,e,[],"");
            //console.warn(comp.elements);
            if(comp.elements.length>0)
            {
                comp.type="textblock";
                //HTMLPeeler.simplify(comp);
                return [comp];
            }
            results=[];
            let contents = e.childNodes;
            let newlvl = level+1;
            // try to extract blocks out of this level
            //console.warn("Compound element @#"+i+", recursing "+level+">"+newlvl);
            //console.log(e);
            //console.info("-----------------------------------");
            // any of these might contain blocks
            if(TN=="TD" || TN=="DIV" || TN=="SECTION" || TN=="HEADER" || TN=="FIGURE" || TN=="ARTICLE")
            {
                contents.forEach((node)=>{
                    //console.error("fuckfuckfuckfuckfuck");
                    let newcomp = this.extractBlocks(node,i, newlvl);
                    // if no blocks were found, return empty
                    if(newcomp && newcomp.length!=0)
                    {
                        //console.log(newcomp);
                        //console.info("Got the above from compound element "+levelref);
                        results.push(...newcomp);
                    }
                    else
                    {
                        //console.error("Got nothing from compound element "+levelref);
                        return null;
                    }
                });
            }
            else
            {
                // try to extract something out of the tag anyway
                // possibly an image or some blocks
                //console.error("unknown, not div");
                
                // fillEl(e,comp);
                results = [comp];
            }
            
        }
        else
        {
            
        }
        /*
        results.forEach((block)=>{
            ////console.error("AAAAAAAAAAAAAAAAAAAA");
            ////console.error(block);
            HTMLPeeler.simplify(block);
        });
        //*/
        // only here if all extractions failed
        if(results.length==1 && results[0].type=="unknown")
        {
            //console.error("Unknown @#:"+i+"/"+level);
            //console.log(e);
            //console.error("--------");
        }
        //console.log(results);
        //console.info("Got the above from element "+levelref);
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
        //console.err("<"+url+"> is a bad URL!!!");
    }
}


// attempt to extract an element into a container
function fillEl(e, container)
{
    return;
    //console.warn("Filling container from element:");
    //console.info(container,e);
    let TN = e.nodeName;
    let nt = e.nodeType;
    // convert block to image if given element is an image
    if(TN =="IMG")
    {
        //console.log("Converted to image.");
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
        //console.log("converted to embed");
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
            //console.log("processing additional stuff in image");
            doP(e,container);
            return;
        }
        // standard extraction of formatted text
        case "textblock":
        case "quote":
        case "codeblock":
        {
            //console.log("doing regular text block");
            doP(e,container);
            return;
        }
        // extract list elements
        case "list":
        {
            //console.log("list time");
            doList(e,container);
            return;
        }
    }
    // turn into a codeblock if this tag found
    // and the container is not yet typed
    if(TN == "CODE")
    {
        //console.log("making a codeblock");
        container.type="codeblock";
        container.content = [];
    }
    // nothing yet, recurse through children
    
    if(e.hasChildNodes())
    {
        //console.info("Element still needs filling");
        let contents = e.childNodes;
            contents.forEach((node)=>{
            fillEl(node,container);
        });
        // if nothing set the container type yet
        // last ditch to extract some text
        if(container.type=="unknown")
        {
            //console.warn("falling back to textblock!");
            //console.log(e.innerHTML);
            //console.log("----------------------------");
            container.type="textblock";
            e.childNodes.forEach((node)=>{
                fillEl(e,container);
            });
        }
    }
}