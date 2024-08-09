//import { RemoteSocket } from "socket.io";
var selectedSocket={};

const setupSocketIO = (io) => {
    io.on('connection', async(socket) => {
        const ip = socket.request.headers['x-forwarded-for'] || socket.request.socket.remoteAddress;
        const skid = socket.id;
        console.log('a user connected', ip, skid);
        
        socket.broadcast.emit('someLoggined');

        socket.on('selectWork', (index) => {
            console.log(index);
            if(skid in selectedSocket){
                selectedSocket[skid].push(index);
            }else{
                selectedSocket[skid]=[];
                selectedSocket[skid].push(index);
            }
            
            socket.broadcast.emit('selected', index);
        });

        socket.on("finishWork", (index) => {
            console.log(index);
            selectedSocket[skid].filter((v)=>v!==index);
            socket.broadcast.emit('finished', index);
            // an event was received from the client
        });

        // 에러 시
        socket.on('error', (error) => {
            console.error(error, ip, socket.id);
        });
        
        // upon disconnection
        socket.on("disconnect", () => {
            socket.broadcast.emit('someDisconnected');
            socket.broadcast.emit('unselect', selectedSocket[skid]);
            const p = delete selectedSocket[skid];
            console.log('미처리된 선택 데이터 해제 :',p);
            console.log('클라이언트 접속 해제', ip, socket.id);
            clearInterval(socket.interval);
        
        });
    });
};

export {setupSocketIO};