import os
import urllib

import cgi
import re
from string import letters

import jinja2
import webapp2

from google.appengine.ext import db
from google.appengine.api import users
from google.appengine.ext import ndb

import time

import uuid

##game imports

import random

from google.appengine.api import channel
import json
import uuid

from main import OnlineHost

def handle_disconnection(channel_id):
    # Find all their subscriptions and delete them.
    q = OnlineUser.all().filter('channel_id =', channel_id)
    users = q.fetch(1000)  
    db.delete(users)

class ChannelConnectHandler(webapp2.RequestHandler):
    def post(self):
        pass
#        host_id = self.request.get('from')
#        q = OnlineUser.all().filter('host_id =', host_id)
#        user = q.fetch(1)[0]
#        user.opened_socket = True
#        user.put()

class ChannelDisconnectHandler(webapp2.RequestHandler):
    def post(self):
        player_id = self.request.get('from')
        host = OnlineHost.get_by_key_name(player_id)
        if host:
          host.delete()

app = webapp2.WSGIApplication([
    ('/_ah/channel/connected/', ChannelConnectHandler),
    ('/_ah/channel/disconnected/', ChannelDisconnectHandler)
], debug=True)
