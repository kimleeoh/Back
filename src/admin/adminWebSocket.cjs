
function adminWebSocketInit(){ 

    socket.on('someLoggined', () => {
        console.log('Admin logged in');
        
        $('li[name="imHere"]').remove();
        
        $.post('/admin/redis', {type: 'current'}, (data,status) => {
            console.log("--");
            console.log(data, status);
            console.log("--");
            if(status!="success"){
                alert('Failed to get current admin list, retry.');
            }else{
                data.forEach((element) => {
                    const newElement = document.createElement('li');
                    newElement.innerHTML = element;
                    newElement.setAttribute('name', 'imHere');
                    console.log(newElement);
                    document.getElementById("presentList").appendChild(newElement);
                });
            }});
    });

    socket.on('someDisconnected', (list) => {
        console.log('Admin logged out');
        
        $('li[name="imHere"]').remove();
        
        $.post('/admin/redis', {type: 'current'}, (data,status) => {
            console.log("--");
            console.log(data, status);
            console.log("--");
            if(status!="success"){
                alert('Failed to get current admin list, retry.');
            }else{
                data.forEach((element) => {
                    const newElement = document.createElement('li');
                    newElement.innerHTML = element;
                    newElement.setAttribute('name', 'imHere');
                    console.log(newElement);
                    document.getElementById("presentList").appendChild(newElement);
                });
            }});
    });


    socket.on('selected', (index) => {
        console.log('Selected work:', index);
        $('#div'+index).css('background-color', 'yellow');
        $('#div'+index).css('pointer-events', 'none');
        $.post('/admin/redis', {type: 'selected', index: index}, (data,status) => {
            console.log(data);
            if(status!="success"){
                alert('Failed to update work, retry.');
            }
        });
    });

    socket.on('unselect', (list) => {
        if(list!=null){
        console.log('unselected work:', list);
        list.forEach((index) => {
        $('#div'+index).css('background-color', 'white');
        $('#div'+index).css('pointer-events', '');});
        $.post('/admin/redis', {type: 'finished', index: list}, (data,status) => {
            console.log(data);
            if(status!="success"){
                alert('Failed to update work, retry.');
            }
        });}
    });

    socket.on('finished', (index) => {
        console.log('Finished work:', index);
        $('#div'+index).remove();
        $.post('/admin/redis', {type: 'finished', index: index}, (data,status) => {
            console.log(data);
            if(status!='success'){
                alert('Failed to update work, retry.');
            }
        });
    });
    
}
function confirmUser(element){
    const parentDiv = element.parentElement;
    const ind = parentDiv.id.toString().replace('div', '');
    const target = ind.split('-')[0]==1? "confirmU" : "warnU";
    $.post('/admin/mongoose', {type: 'confirm', id: parentDiv.children[0].innerHTML, where:target}, (data,status) => {
        if(status=='success'){
            $('#div'+ind).remove();
            socket.emit('finishWork', ind);
        }else{
            alert('Failed to confirm user, retry.');
        }
    });

}

function rejectUser(element){
    const parentDiv = element.parentElement;
    const ind = parentDiv.id.toString().replace('div', '');
    const target = ind.split('-')[0]==1? "confirmU" : "warnU";
    $.post('/admin/mongoose', {type: 'unconfirm', id: parentDiv.children[0].innerHTML, where:target}, (data,status) => {
        if(status=='success'){
            $('#div'+ind).remove();
            socket.emit('finishWork', ind);
        }
        else{
            alert('Failed to reject user, retry.');
        }
    });
}

function logout(){
    socket.disconnect();
}

function fireSelected(element){
    element.setAttribute('disabled',true);
    const result = element.id.toString().replace('div', '');
    socket.emit('selectWork', result);
    const a = Array.from(element.children);
    console.log(a);
    a.forEach((Item) => {
        if (Item.hasAttribute('disabled','true')) {
      Item.removeAttribute('disabled');
        }if(Item.hasAttribute('pointer-events', 'none')){
            Item.style.pointerEvents='';
        }
    });
  }

function openNewWindow(element){
    console.log(element.innerHTML);
    window.open("https://d1bp3kp7g4awpu.cloudfront.net/test.png");
}

module.exports={adminWebSocketInit, logout, fireSelected, confirmUser, rejectUser, openNewWindow};



