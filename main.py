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
import datetime

import uuid

##game imports

import random

from google.appengine.api import channel
import json
import uuid

template_dir = os.path.join(os.path.dirname(__file__), 'templates')
jinja_env = jinja2.Environment(loader = jinja2.FileSystemLoader(template_dir),
                               autoescape = True)


DEFAULT_GUESTBOOK_NAME = 'default_guestbook'

def guestbook_key(guestbook_name=DEFAULT_GUESTBOOK_NAME):
    """Constructs a Datastore key for a Guestbook entity with guestbook_name."""
    return ndb.Key('Guestbook', guestbook_name)

class Score(ndb.Model):
    """Models an individual Guestbook entry."""
    player = ndb.StringProperty()
    score = ndb.IntegerProperty()
    date = ndb.DateTimeProperty(auto_now_add=True)  

class Game(db.Model):
    host_token = db.StringProperty()
    player_tokens = db.StringListProperty()
    num_players = db.IntegerProperty()

class OnlineHost(db.Model):
    host_nick = db.StringProperty()
    game_code = db.StringProperty()
    created = db.DateTimeProperty(auto_now_add=True)
    
def render_str(template, **params):
  t = jinja_env.get_template(template)
  return t.render(params)

class Handler(webapp2.RequestHandler):
    def write(self, *a, **kw):
        self.response.out.write(*a, **kw)

    def render(self, template, **kw):
        self.response.out.write(render_str(template, **kw))

        
class HostHandler(Handler):
    def get(self):
        game_key = str(random.randint(1001,9999))
        self.response.set_cookie('game_key',game_key)
        self.response.set_cookie('nickname','')
        player_id = str(uuid.uuid4()).replace('-','')
        template_vars = {'game_key':game_key}
        self.render('host.html',**template_vars)
    def post(self):
        nickname = self.request.get('nickname')
        self.response.set_cookie('nickname',nickname)
        self.redirect('/multi')
        
class MainHandler(Handler):
  def get(self):
    self.render('index.html')

class ActiveHandler(Handler):
  def get(self):
    hosts_query = db.Query(OnlineHost)
    hosts = hosts_query.fetch(100)
    active_hosts = []
    for host in hosts:
      if ((datetime.datetime.now() - host.created).seconds < 600):
        active_hosts.append(host)
    self.render('active.html',hosts=active_hosts)

class ClearHandler(Handler):
  def get(self):
    hosts = OnlineHost.all()
    db.delete(hosts)
    
class MultiHandler(Handler):
    def get(self):
        game_key = self.request.cookies.get('game_key')
        nickname = self.request.cookies.get('nickname')
        if (not game_key or not nickname):
          self.redirect('/host')
        else:
          player_id = str(uuid.uuid4()).replace('-','')
          token = channel.create_channel(player_id)
          game = Game(key_name = game_key,
                      host_token = token,
                      num_players = 1)
          game.put()
          host = OnlineHost(key_name = player_id,
                            host_nick=nickname,
                            game_code = game_key)
          host.put()
          template_vars = {'player':nickname,
                          'game_key':game_key,
                          'token':token}
          self.render('multi.html',**template_vars)
    def post(self):
        nickname = self.request.get('nickname')
        self.response.set_cookie('nickname',nickname)
        self.redirect('/multi')

class SoloHandler(Handler):
    def get(self):
      
        guestbook_name = self.request.get('guestbook_name',DEFAULT_GUESTBOOK_NAME)                                           
        scores_query = Score.query(
        ancestor=guestbook_key(guestbook_name)).order(-Score.score)
        scores = scores_query.fetch(10)
        try:
          lowest_score = scores[-1].score
        except:
          lowest_score = 0
        player = self.request.cookies.get('player','Anonymous')
        self.render('main.html',player=player,lowest_score=lowest_score)

        
class ClientHandler(Handler):
    def get(self):
        player = self.request.cookies.get('nickname')
        game_key = self.request.get('g')
        game = Game.get_by_key_name(game_key)
        player_id = str(uuid.uuid4()).replace('-','')
        token = channel.create_channel(player_id)
        player_list = game.player_tokens
        player_list += [token]
        game.num_players += 1
        game.put()
        template_vars = {'token':token,
                        'game_key':game_key,
                        'player':player}
        self.render('client.html',**template_vars)

class MoveHandler(Handler):
    def post(self):
        game_key = self.request.get('g')
        game = Game.get_by_key_name(game_key)
        host_token = game.host_token
        nickname = self.request.get('actor')
        action = self.request.get('action')
        cards = self.request.get('cards')
        msg = {'nickname':nickname,
               'action':action}
        if cards:
            msg['cards'] = cards.split(',')
        channel_msg = json.dumps(msg)
        channel.send_message(host_token,channel_msg)
              
        
class JoinHandler(Handler):
    def get(self):
        game_key = self.request.get('g')
        self.response.set_cookie('game_key',game_key)
        self.render('join.html',game_key = game_key)
    def post(self):
        nickname = self.request.get('nickname')
        self.response.set_cookie('nickname',nickname.encode('utf8'))
        game_key = self.request.get('game-key')
        game = Game.get_by_key_name(game_key)
        if not game:
          error = "Game does not exist!"
          self.render('join.html',game_key=game_key,error=error)
        else:
          self.redirect('/client?g='+game_key)

class BroadcastHandler(Handler):
    def post(self):
        game_key = self.request.get('g')
        game = Game.get_by_key_name(game_key)
        tokens = game.player_tokens
        action = self.request.get('action')
        state = json.loads(self.request.get('state'))
        actor = self.request.get('actor')
        cards = self.request.get('cards').split(',')
        msg = {'action':action,
               'state':state,
               'cards':cards,
               'actor':actor,
              }
        channel_msg = json.dumps(msg)
        for token in tokens:
            channel.send_message(token, channel_msg)
        
class OpenHandler(Handler):
    def post(self):
      game_key = self.request.get('g')
      nickname = self.request.cookies.get('nickname')
      game = Game.get_by_key_name(game_key)
      host_token = game.host_token
      msg = {'nickname':nickname,
            'action':'joined'}
      channel.send_message(host_token,json.dumps(msg))      
                
class ScoreHandler(Handler):
    def get(self):
        guestbook_name = self.request.get('guestbook_name',DEFAULT_GUESTBOOK_NAME)                                           
        scores_query = Score.query(
        ancestor=guestbook_key(guestbook_name)).order(-Score.score)
        scores = scores_query.fetch(10)

        self.render('scores.html',scores=scores)
    
    def post(self):
        # We set the same parent key on the 'Greeting' to ensure each Greeting
        # is in the same entity group. Queries across the single entity group
        # will be consistent. However, the write rate to a single entity group
        # should be limited to ~1/second.
        guestbook_name = self.request.get('guestbook_name',
                                          DEFAULT_GUESTBOOK_NAME)
        score = Score(parent=guestbook_key(guestbook_name))
        
        stored_name = self.request.get('user')
        if stored_name == 'null':
          stored_name = 'Nobody'
        
        self.response.headers.add_header('Set-Cookie', 'player=%s' % stored_name.encode('utf8'))

        if len(stored_name) > 100:
            stored_name = stored_name[:100]
        
        score.player = stored_name
        score.score = int(self.request.get('score'))
        score.put()

        self.redirect('/scores')
    
class RulesHandler(Handler):
    def get(self):
        self.render('rules.html')

app = webapp2.WSGIApplication([
    ('/', MainHandler),
    ('/active',ActiveHandler),
    ('/clear',ClearHandler),
    ('/multi', MultiHandler),
    ('/solo',SoloHandler),
    ('/host',HostHandler),
    ('/broadcast',BroadcastHandler),
    ('/move',MoveHandler),
    ('/join',JoinHandler),
    ('/opened',OpenHandler),
    ('/client',ClientHandler),
    ('/scores',ScoreHandler),
    ('/rules',RulesHandler)
], debug=True)
