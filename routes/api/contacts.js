const express = require('express')
const router = express.Router()
const Joi = require('joi')

const { listContacts, getContactById, removeContact, addContact, updateContact } = require("../../models/contacts")

router.get('/', async (req, res, next) => {
  const contacts = await listContacts()
  res.status(200).json( contacts )
})

router.get('/:id', async (req, res, next) => {
  const contactId = req.params.id
  const contact = await getContactById(contactId)
  
  if (!contact) return res.status(404).json({ "message": "Not found" })
  
  res.status(200).json(contact)
})

router.post('/', async (req, res, next) => {
  const body = req.body
  
  const schema = Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required()
  })
  const { error } = schema.validate(body)
  if (error) return res.status(400).json({"message": `${error.details[0].message}`});    

  const contact = await addContact(body)
 
  res.status(201).send(contact)
})

router.delete('/:id', async (req, res, next) => {
  const contactId = req.params.id
  const contact = await getContactById(contactId)
 
  if (!contact) return res.status(404).json({ "message": "Not found" })
  
  removeContact(contactId)
  res.status(200).json({"message": "contact deleted"})
})


router.put('/:id', async (req, res, next) => {
  const contactId = req.params.id
  const body = req.body
 
  if (Object.keys(body).length === 0) return res.status(400).json({ "message": "missing fields" });
  
  const schema = Joi.object().keys({
    name: Joi.string(),
    email: Joi.string().email(),
    phone: Joi.string()
  })
  const { error } = schema.validate(body)
  if (error) return res.status(404).send(error.details[0].message);
  
  const updatedContact = await updateContact(contactId, req.body);
  if (updatedContact) { res.status(200).send(updatedContact) }
  else return res.status(404).json({ "message": "Not found" });
})


module.exports = router
