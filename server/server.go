package main

import (
	// General
	"github.com/golang/glog"
	"flag"
	"github.com/iambc/xerrors"

	//API
	"net/http"
	"encoding/json"

	//DB
	"database/sql"
	_ "github.com/lib/pq"
)

type image_board_clusters struct {
    Id int
    Descr string
    LongDescr string
    BoardLimitCount int
}

type boards struct {
    Id int `json:"id"`
    Name string `json:"name"`
    Descr string
    ImageBoardCluster_id string
    BoardLimitCount int
}

type threads struct{
    Id int
    Name string
    Descr string
    Board_id int
    MaxPostsPerThread int
    AreAttachmentsAllowed bool
    LimitsReachedActionId int
}

type thread_posts struct{
    Id int
    Body string
    ThreadId int
    AttachmentUrl int
}

type thread_limits_reached_actions struct{
    Id	    int
    Name    string
    Descr   string
}

type api_request struct{
    Status  string
    Msg	    *string
    Payload interface{}
}

func getBoards(res http.ResponseWriter, req *http.Request)  error {
    if req == nil {
	return xerrors.NewSysErr()
    }

    dbh, err := sql.Open("postgres", "user=abc_api password=123 dbname=abc_dev_cluster sslmode=disable")
    if err != nil {
	return xerrors.NewUiErr(err.Error(), err.Error())
    }
    rows, err := dbh.Query("select id, name from boards;")
    if err != nil {
	return xerrors.NewUiErr(err.Error(), err.Error())
    }
    defer rows.Close()

    var curr_boards []boards
    for rows.Next() {
	var board boards
	err = rows.Scan(&board.Id, &board.Name)
	if err != nil {
	    return xerrors.NewUiErr(err.Error(), err.Error())
	}
	curr_boards = append(curr_boards, board)
    }
    bytes, err1 := json.Marshal(api_request{"ok", nil, &curr_boards})
    if err1 != nil {
	return xerrors.NewUiErr(err1.Error(), err1.Error())
    }
    res.Write(bytes)
    return nil
}

func getActiveThreadsForBoard(res http.ResponseWriter, req *http.Request)  error {
    if req == nil {
        return xerrors.NewSysErr()
    }
    values := req.URL.Query()
    board_id, is_passed := values[`board_id`]
    if !is_passed {
	res.Write([]byte(`Invalid params: No board_id given!`))
	return xerrors.NewUiErr(`Invalid params: No board_id given!`, `Invalid params: No board_id given!`)
    }

    dbh, err := sql.Open("postgres", "user=abc_api password=123 dbname=abc_dev_cluster sslmode=disable")
    if err != nil {
        return xerrors.NewUiErr(err.Error(), err.Error())
    }
    rows, err := dbh.Query("select id, name from threads where board_id = $1;", board_id[0])
    if err != nil {
        return xerrors.NewUiErr(err.Error(), err.Error())
    }
    defer rows.Close()

    var active_threads []threads
    for rows.Next() {
	glog.Info("Popped new thread")
        var thread threads
        err = rows.Scan(&thread.Id, &thread.Name)
        if err != nil {
            return xerrors.NewUiErr(err.Error(), err.Error())
        }
        active_threads = append(active_threads, thread)
    }
    bytes, err1 := json.Marshal(api_request{"ok", nil, &active_threads})
    if err1 != nil {
        return xerrors.NewUiErr(err1.Error(), err1.Error())
    }
    res.Write(bytes)

    return nil
}

func getPostsForThread(res http.ResponseWriter, req *http.Request)  error {
    if req == nil {
        return xerrors.NewSysErr()
    }
    values := req.URL.Query()
    thread_id, is_passed := values[`thread_id`]
    if !is_passed {
        res.Write([]byte(`Invalid params: No thread_id given!`))
        return xerrors.NewUiErr(`Invalid params: No thread_id given!`, `Invalid params: No thread_id given!`)
    }

    dbh, err := sql.Open("postgres", "user=abc_api password=123 dbname=abc_dev_cluster sslmode=disable")
    if err != nil {
        return xerrors.NewUiErr(err.Error(), err.Error())
    }

    rows, err := dbh.Query("select id, name from thread_posts where thread_id = $1;", thread_id[0])
    if err != nil {
        return xerrors.NewUiErr(err.Error(), err.Error())
    }
    defer rows.Close()

    var curr_posts []thread_posts
    for rows.Next() {
        glog.Info("Popped new thread")
        var curr_post thread_posts
        err = rows.Scan(&curr_post.Id, &curr_post.Body)
        if err != nil {
            return xerrors.NewUiErr(err.Error(), err.Error())
        }
        curr_posts = append(curr_posts, curr_post)
    }
    bytes, err1 := json.Marshal(api_request{"ok", nil, &curr_posts})
    if err1 != nil {
        return xerrors.NewUiErr(err1.Error(), err1.Error())
    }
    res.Write(bytes)

    return nil
}


func addPostToThread(res http.ResponseWriter, req *http.Request) error {
    return nil
}
// sample usage
func main() {
    flag.Parse()

    commands := map[string]func(http.ResponseWriter, *http.Request) error{
				"getBoards": getBoards,
				"getActiveThreadsForBoard": getActiveThreadsForBoard,
			       }

    http.HandleFunc("/api", func(res http.ResponseWriter, req *http.Request) {
					values := req.URL.Query()
					command, is_passed := values[`command`]
					if !is_passed {
					    res.Write([]byte(`Invalid params: No command name given!`))
					    return
					}
					_, is_passed = commands[command[0]]
					if !is_passed{
					    res.Write([]byte(`Invalid params: No such command!`))
					    return
					}

					err := commands[command[0]](res, req)
					if err != nil{
					    glog.Error(err)
					}
    })

    http.ListenAndServe(`:8089`, nil)
}



