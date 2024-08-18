function adminWebSocketInit() { 
    socket.on('someLoggined', () => {
        console.log('Admin logged in');
        
        $('li[name="imHere"]').remove();
        
        $.post('/admin/redis', {type: 'current'}, (data, status) => {
            if (status != "success") {
                alert('Failed to get current admin list, retry.');
            } else {
                data.forEach((element) => {
                    const newElement = document.createElement('li');
                    newElement.innerHTML = element;
                    newElement.setAttribute('name', 'imHere');
                    document.getElementById("presentList").appendChild(newElement);
                });
            }
        });
    });

    socket.on('someDisconnected', () => {
        console.log('Admin logged out');
        
        $('li[name="imHere"]').remove();
        
        $.post('/admin/redis', {type: 'current'}, (data, status) => {
            if (status != "success") {
                alert('Failed to get current admin list, retry.');
            } else {
                data.forEach((element) => {
                    const newElement = document.createElement('li');
                    newElement.innerHTML = element;
                    newElement.setAttribute('name', 'imHere');
                    document.getElementById("presentList").appendChild(newElement);
                });
            }
        });
    });

    socket.on('selected', (index) => {
        console.log('Selected work:', index);
        const targetDiv = $('#div' + index);

        // LED Indicator 및 버튼 상태 업데이트
        targetDiv.find('.led-indicator').removeClass('led-available led-unavailable').addClass('led-selected');
        targetDiv.find('button').removeAttr('disabled');
    });

    socket.on('unselect', (list) => {
        if (list != null) {
            console.log('Unselected work:', list);
            list.forEach((index) => {
                const targetDiv = $('#div' + index);

                // LED Indicator 및 버튼 상태 업데이트
                targetDiv.find('.led-indicator').removeClass('led-selected led-unavailable').addClass('led-available');
                targetDiv.find('button').attr('disabled', true);
            });
        }
    });

    socket.on('finished', (index) => {
        console.log('Finished work:', index);
        $('#div' + index).remove();
    });
}

function confirmUser(element) {
    const parentDiv = element.closest('.request');
    const ind = parentDiv.id.replace('div', '');
    const target = ind.split('-')[0] == 1 ? "confirmU" : "warnU";
    $.post('/admin/mongoose', {type: 'confirm', id: parentDiv.querySelector('.userObjectID').innerHTML, where: target}, (data, status) => {
        if (status == 'success') {
            $('#div' + ind).remove();
            socket.emit('finishWork', ind);
        } else {
            alert('Failed to confirm user, retry.');
        }
    });
}

function rejectUser(element) {
    const parentDiv = element.closest('.request');
    const ind = parentDiv.id.replace('div', '');
    const target = ind.split('-')[0] == 1 ? "confirmU" : "warnU";
    $.post('/admin/mongoose', {type: 'unconfirm', id: parentDiv.querySelector('.userObjectID').innerHTML, where: target}, (data, status) => {
        if (status == 'success') {
            $('#div' + ind).remove();
            socket.emit('finishWork', ind);
        } else {
            alert('Failed to reject user, retry.');
        }
    });
}

function fireSelected(element) {
    const ind = element.id.replace('div', '');
    socket.emit('selectWork', ind);
}

function openNewWindow(element) {
    window.open("https://d1bp3kp7g4awpu.cloudfront.net/test.png");
}

module.exports = {adminWebSocketInit, logout, fireSelected, confirmUser, rejectUser, openNewWindow};
