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
// shorthand to create a "unit" of text content
function makeTextElement(text, styles, link, image)
{
    return {text: text, styles: styles, link:link, image: image};
}
function emitHTMLText(block,target)
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
                lastElement= emitHTMLElement(e,false);
                target.append(lastElement);
                lastElement=target;
            }
            else
            {
                lastElement = emitHTMLElement(e,true);
                target.append(lastElement);
            }
        }
        else
        {
            lastElement.append(emitHTMLElement(e,false));
        }
        currentImg=img;
    });
}
// converts a text unit into HTML content
function emitHTMLElement(textElement, imgContainer)
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


// attempt to extract formatted text into a text, code or blockquote container
function extractTextContent(container,element, styles, link,image)
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
        container.push(makeTextElement("",[],"",element.src));
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
        container.push(makeTextElement(element.data,[...styles],currentLink,currentImage));
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
        extractTextContent(container,node,currentStyles,currentLink,currentImage);
    });
    console.log(TN,element,container);
}

// output text with line breaks
function doText(text,target)
{

    target.append(document.createTextNode(text));
    return;
    // split by line break
    // lines = text.split("\n");
    // output text
    for(let i=0;i<lines.length;i++)
    {
        let t = document.createTextNode(lines[i]);
        target.append(t);
        // line break after every piece except last
        if(i<lines.length-1)
        {
            target.append(document.createElement("br"));
        }
    }
}

// output formatted text into an element
function blockOut(list,target)
{
    // keep a running buffer of text to ouput between tags
    let text="";
    console.log(typeof list);
    // input might be a flat string, insert it as a text block and exit
    if(typeof list == "string")
    {
        doText(list,target);
        return;
    }
    // exit if there's nothing in the block
    if(!list)
    {
        return;
    }
    // run through every component
    list.forEach((item)=>{
        switch(item.type)
        {
            // plain text goes into accumulator
            case "text":
            {
                text+=item.content;
                break;
            }
            // links
            case "link":
            {
                // flush any accumulated text
                if(text!="")
                {
                    doText(text,target);
                    text ="";
                }
                // emit the link
                let a = document.createElement("a");
                a.href=item.href;
                a.innerText=item.content;
                target.append(a);
                break;
            }
            // any text inside formatting tags
            case "formatted_text":
            {
                // flush accumulator
                if(text!="")
                {
                    doText(text,target);
                    text ="";
                }
                // create corresponding formatting tag
                // that does kinda mean no nesting possible
                let a = document.createElement(item.format);
                a.innerText=item.content;
                target.append(a);
                break;
            }
        }
        
    });
    // flush any remaining text
    if(text!="")
    {
        doText(text,target);
        text ="";
    }
}

function imageOut(list,target)
{

}
// emit a list of blocks into a target container element
function docOut(doc,output)
{
    let headers = [];
    let headerno=0;
    doc.forEach((block, i)=>{
        switch(block.type)
        {
            // h1..7
            case "header":
            {
                let e =document.createElement("h"+block.level);
                emitHTMLText(block,e);
                // e.innerText=block.content;
                e.dataset.num=i;
                e.id="header"+headerno;
                headers.push(e.textContent);
                headerno++;
                output.appendChild(e);
                break;
            }
            // plain text block
            case "textblock":
            {
                let e = document.createElement("p");
                emitHTMLText(block,e);
                e.dataset.num=i;
                output.appendChild(e);
                break;
            }
            // blockquote
            case "quote":
            {
                let e = document.createElement("blockquote");
                emitHTMLText(block,e);
                e.dataset.num=i;
                output.appendChild(e);
                break;
            }
            // code, gets put inside a blockquote
            case "codeblock":
            {
                let pre = document.createElement("pre");
                let e = document.createElement("code");
                emitHTMLText(block,e);
                e.dataset.num=i;
                let bq = document.createElement("blockquote");
                bq.dataset.num=i;
                bq.appendChild(pre);
                pre.appendChild(e);
                output.appendChild(bq);
                break;
            }
            // image, gets a description attached
            case "image":
            {
                let img = document.createElement("img");
                img.src = block.src;
                let e = document.createElement("p");
                e.classList.add("description");
                e.dataset.num=i;
                e.appendChild(img);
                // if it has a description, write it out
                if(block.description && block.description.length>1)
                {
                    e.appendChild(document.createElement("br"));
                    e.appendChild(document.createTextNode(block.description));
                }
                output.appendChild(e);
                break;
            }
            // ordered or unordered list, items as blocks
            case "list":
            {
                if(block.listType=="definition")
                {      
                    let e = document.createElement("dl");
                    e.dataset.num=i;
                    block.items.forEach((li)=>{
                        let dt = document.createElement("dt");
                        emitHTMLText(li.term,dt);
                        e.appendChild(dt);
                        let dd = document.createElement("dd");
                        emitHTMLText(li.definition,dd);
                        e.appendChild(dd);
                    });
                    output.appendChild(e);
                    break;
                }
                let e = document.createElement(block.listType == "ordered"?"ol":"ul");
                e.dataset.num=i;
                block.items.forEach((li)=>{
                    let eli = document.createElement("li");
                    emitHTMLText(li,eli);
                    e.appendChild(eli);
                });
                
                output.appendChild(e);
                break;
            }
        }
    });
    return headers;
}

function cmpfmt(a,b)
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

function tryMergeNodes(a,b)
{
    console.warn("Trying to merge ",a ,b);
    if(!a || !b)
    {
        return false;
    }
    if(a.link!=b.link)
    {
        return false;
    }
    if(!cmpfmt(a.styles,b.styles))
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

function simplify(block)
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
            simplify(li);
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
        if(tryMergeNodes(current,next))
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

function flatten(nodes,depth)
{
    console.log(nodes, depth);
    if(depth == 0)
        return Array.from(nodes);
    let result = [];
    nodes.forEach((node)=>{
        result.push(...flatten(node.childNodes,depth-1));
        console.log(result);
        });
    return result;
}

function scrape(e,depth = 0)
{
    let doc = [];
    let contents = flatten(e.childNodes,depth);
    // contents = e.querySelectorAll("p, h1, h2, h3, h4, h5, h6,  header, blockquote, ul, ol, dl, table");
    // run over every child element and extract blocks
    contents.forEach((node,i)=>{
        console.warn("processing #"+i+"<"+node.nodeName+">");
        console.log(node.innerHTML);
        let comp = getEl(node,i,0);
        if(comp)
        {
            doc.push(...comp);
        }
    });
    console.error("Done processing elements, formatting the data...");
    console.log(doc);
    return doc;
}
// this gets the components
function getEl(e,i, level=0)
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
            
            let test1=[];
            extractTextContent(test1,e,[],"");
            comp.elements = test1;
            comp.content = [{type:"text",content:e.textContent.trim()}];
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
            extractTextContent(comp.elements,td,[],"");
            let results = [];
            td.childNodes.forEach((n)=>{
                let el = getEl(n,i,level+1);
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
        getVideoTypeInfo(e.src,comp);
    }
    // do lists
    if(TN =="OL")
    {
        comp.type="list";
        comp.items = getRegularList(e);
        comp.listType="ordered";
    }
    if(TN =="UL")
    {
        comp.type="list";
        comp.items = getRegularList(e);
        comp.listType="unordered";
    }
    if(TN=="DL")
    {
        comp.type="list";
        comp.items = getDefinitionList(e);
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
        let test1=[];
        extractTextContent(test1,e,[],"");
        comp.elements = test1;
        e.childNodes.forEach((c)=>{  
            console.error(test1); 
            fillEl(c,comp);
        });
        // the check for textblock exists because
        // it may turn into an image block
        if(comp.content.length<1 && comp.type=="textblock")
        {
            console.error("Empty element "+levelref);
            return null;
        }
    }
    // same for blockquotes
    if(TN=="BLOCKQUOTE")
    {
        comp.type="quote";
        let test1=[];
        extractTextContent(test1,e,[],"");
        comp.elements = test1;
        e.childNodes.forEach((c)=>{   
            fillEl(c,comp);
        });
    }
    // h1..7
    if(TN[0]=="H" && TN.length==2)
    {
        comp.type="header";
        comp.level=Number.parseInt(TN[1]);
        comp.content=e.innerText;
        let test1=[];
        extractTextContent(test1,e,[],"");
        comp.elements = test1;
        return [comp];
    }
    let results = [comp];
    // some other tag, check if it is not empty
    if(e.hasChildNodes() && comp.type=="unknown")
    {
        console.error("AAAAAAAAAAAAAAAFUCK");
        let test1=[];
        extractTextContent(test1,e,[],"");
        comp.elements = test1;
        console.warn(comp.elements);
        if(comp.elements.length>0)
        {
            comp.type="textblock";
            simplify(comp);
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
                let newcomp = getEl(node,i, newlvl);
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
            
            fillEl(e,comp);
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
        simplify(block);
    });
    console.log(results);
    console.info("Got the above from element "+levelref);
    return results;
}

function doImage(e,c)
{

}
// attempt to extract formatted text into a text, code or blockquote container
function doP(e,c)
{


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
    let TN = e.nodeName;
    let nt = e.nodeType;
    if(nt == Node.TEXT_NODE)
    {
        c.content.push({"type":"text","content":e.data});
    }
    else
    {
        console.log("TAG IN P:"+TN);
    }
    if(TN=="P")
    {
        e.childNodes.forEach((node)=>{
            doP(node,c);
        });
    }
    if(TN=="A")
    {
        c.content.push({"type":"link","content":e.innerText, "href":e.href});
    }
    if(TN=="SPAN" && e.innerText.trim()!="")
    {
        c.content.push({"type":"text","content":e.innerText});
    }
    if(fmap[TN])
    {
        c.content.push({"type":"formatted_text","content":e.innerText,"format":fmap[TN]});
    }
    console.log(TN,e,c);
}
// expects an OL or UL element
function getRegularList(element)
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
        extractTextContent(item,node,[],"");
        result.push(item);
    });
    return result;
}

// expects a DL
function getDefinitionList(element)
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
            extractTextContent(li.term,node,[],"");
        }
        if(node.tagName=="DD" && result.length>0)
        {
            extractTextContent(result[result.length-1].definition,node,[],"");
        }
    });
    return result;
}

// attempt to extract a list into a container
function doList(e,c)
{
    // this is only called on children elements
    // of <ul> or <ol>
    let TN = e.nodeName;
    // therefore ignore anything that's not a <li>
    console.warn("Fetching list item <"+TN+">");
    if(TN=="LI")
    {
        let li = {"content":[]};
        
        if(e.hasChildNodes())
        {
            let contents = e.childNodes;
                contents.forEach((node)=>{
                doP(node,li);
            });
        }
        c.items.push(li);
    }
    if(TN=="DT")
    {
        let li = {"term":[],"definition":[],"content":[]};
        if(e.hasChildNodes())
        {
            let contents = e.childNodes;
                contents.forEach((node)=>{
                doP(node,li);
            });
            console.log(li);
            li.term = li.content;
            li.content=[];
        }
        c.items.push(li);
    }
    if(TN=="DD" && c.items && c.items.length>0)
    {
        let li = c.items[c.items.length-1];
        let contents = e.childNodes;
                contents.forEach((node)=>{
                doP(node,li);
            });
            li.definition = li.content;
            li.content=[];
    }
}
// attempt to extract an element into a container
function fillEl(e, container)
{
    
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