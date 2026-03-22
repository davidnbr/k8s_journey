{
  pkgs,
  lib,
  config,
  inputs,
  ...
}:

{
  cachix.pull = [ "nixpkgs-nodejs" ];

  packages = [ pkgs.nodejs_22_22 ];

  languages = {
    javascript = {
      enable = true;
      package = pkgs.nodejs_22_22;
    };
  };
}
