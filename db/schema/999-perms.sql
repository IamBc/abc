CREATE USER abc_api WITH PASSWORD '123';
GRANT SELECT    ON thread_posts         TO abc_api; 
GRANT INSERT    ON thread_posts         TO abc_api; 
GRANT USAGE     ON thread_posts_id_seq  TO abc_api;
GRANT SELECT    ON threads              TO abc_api;
GRANT INSERT    ON threads              TO abc_api;
GRANT USAGE     ON threads_id_seq       TO abc_api;
GRANT SELECT    ON boards               TO abc_api;
GRANT USAGE     ON boards_id_seq        TO abc_api;
GRANT SELECT    ON image_board_clusters TO abc_api;
GRANT USAGE     ON image_board_clusters_id_seq TO abc_api;
GRANT SELECT    ON thread_limits_reached_actions TO abc_api;
GRANT USAGE     ON thread_limits_reached_actions_id_seq TO abc_api;
GRANT delete on threads, thread_posts to abc_api;
