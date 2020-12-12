#! /bin/sh
#
# update.sh
# Copyright (C) 2020 Callum McColl <Callum McColl@callum.lan>
#
# Distributed under terms of the MIT license.
#


git pull
sudo systemctl restart pm2-acey
