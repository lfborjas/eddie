var last_message_time = 1,
    converter = new Showdown.converter()

function longPoll(data){
    if(data && data.messages){
        $.each(data.messages, function(index, message){
            if(message.timestamp> last_message_time){
                last_message_time = message.timestamp;
            } 
            $("<li>"+converter.makeHtml(message.text)+"</li>").fadeIn().prependTo('#messages');

        });
    } //process data

    //poll again
    $.getJSON(
        "/messages",
        {since: last_message_time},
        function(data){
            longPoll(data);
        }
    );
} 

$(function(){        
    longPoll();
    $("#message-form").submit(function(e){
        e.preventDefault();
        $("#button").attr("disabled", 'disabled')
        $.getJSON('/messages/send',
               $('#message-form').serialize(),
               function(){
                    $('textarea').val('')
                    $("#button").removeAttr('disabled')
               }
        );
    });
});
