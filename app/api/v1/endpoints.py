def validate(validated_info: ValidatedInfo, db: Session = Depends(get_db)):
    try:
        doc_id = validated_info.doc_id
        document_to_update = db.query(Document).filter_by(id=doc_id).first()

        if not document_to_update:
            raise HTTPException(status_code=400, detail=f"Document with id {doc_id} not found!")
        
        # Update the attributes of the record with validated info
        document_to_update.doctype = validated_info.extracted_info["doctype"]
        document_to_update.date = convert_date_format(validated_info.extracted_info["date"])
        document_to_update.entity_or_reason = validated_info.extracted_info["entite_ou_raison"]
        document_to_update.additional_info = json.dumps(validated_info.extracted_info['info_supplementaires'])
        
        # Commit the changes
        db.commit()

        # If the document is an image, move it to its final location based on validated info
        with open(f'app/storage/temp_storage/{doc_id}.json', 'r') as meta_file:
            metadata = json.load(meta_file)

        if metadata['is_image']:
            directory = f"app/storage/{validated_info.extracted_info['doctype']}/{validated_info.extracted_info['entite_ou_raison']}/"
            if not os.path.exists(directory):
                os.makedirs(directory)
            final_file_path = f'{directory}{validated_info.extracted_info["date"].replace("/","-")}.jpg'
            shutil.move(f"app/storage/temp_storage/{doc_id}.jpg", final_file_path)

        # Convert validated info to semantic format and store in chroma_db (if needed)
        # ... [This part is based on your notebook's code and might need further adaptation]

        return {"message": "Document updated successfully!"}
    
    except ValueError as ve:
        logger.error(f'Value error: {ve}')
        db.rollback()
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="An unexpected error occurred")
    finally:
        db.close()