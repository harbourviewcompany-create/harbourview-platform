-- Command-centre stats include operational/admin counts and are not a general authenticated RPC.
-- The application already treats this RPC as optional and falls back to its inline loader.
-- Keep the underlying SECURITY DEFINER function service-role only and remove the API wrapper's
-- authenticated execution grant that exposed those aggregate operational counts to any signed-in user.

revoke execute on function api.get_command_centre_stats() from authenticated;
